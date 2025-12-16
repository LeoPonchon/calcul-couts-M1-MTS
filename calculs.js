// ========== DONNÉES ==========

const PRIX_BOIS = 2150; // €/m3
const PRIX_PLASTIQUE = 5200 / 2; // €/tonne

const BATEAUX = {
    "Pech 4": { bois: 0.1, plastique: 0.2, moulage_h: 8, finition_h: 10, prixVente: 15000 },
    "Prom 5.5": { bois: 0.2, plastique: 0.4, moulage_h: 12, finition_h: 14, prixVente: 25000 },
    "Stan 8": { bois: 0.5, plastique: 1.0, moulage_h: 28, finition_h: 28, prixVente: 50000 }
};

// Coefficients saisonniers par mois (Janvier à Décembre)
const COEFFICIENTS_SAISONNIERS = {
    "Pech 4": [0.7, 0.7, 0.7, 1.4, 1.4, 1.4, 1.2, 1.2, 1.2, 0.7, 0.7, 0.7],
    "Prom 5.5": [0.6, 0.6, 0.6, 1.9, 1.9, 1.9, 0.9, 0.9, 0.9, 0.6, 0.6, 0.6],
    "Stan 8": [0.7, 0.7, 0.7, 1.9, 1.9, 1.9, 1.0, 1.0, 1.0, 0.4, 0.4, 0.4]
};

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const COUT_MACHINE_MOULAGE_H = 50; // €/h
const COUT_MACHINE_FINITION_H = 70; // €/h
const COUT_ATELIER_MOULAGE = 4000; // €/mois
const COUT_ATELIER_FINITION = 3000; // €/mois
const COUT_MACHINE_MOULAGE = 10000 * 7; // €/mois (7 machines)
const COUT_MACHINE_FINITION = 5000 * 8; // €/mois (8 machines)
const CAPACITE_MOULAGE = 1400; // h/mois
const CAPACITE_FINITION = 1600; // h/mois

// MOD
const NB_EMPLOYES_PRODUCTION = 5;
const SALAIRE_EMPLOYE_PRODUCTION = 2000; // €/mois
const HEURES_MOIS = 151.67; // heures/mois
const COUT_MOD_TOTAL_MENSUEL = NB_EMPLOYES_PRODUCTION * SALAIRE_EMPLOYE_PRODUCTION;
const COUT_MOD_HORAIRE = COUT_MOD_TOTAL_MENSUEL / (NB_EMPLOYES_PRODUCTION * HEURES_MOIS);

// ========== FONCTIONS DE CALCUL ==========

function coutProduction(nomBateau, quantiteMensuelle) {
    const b = BATEAUX[nomBateau];
    
    // 1. COÛTS DIRECTS
    const coutMatieres = (b.bois * PRIX_BOIS) + (b.plastique * PRIX_PLASTIQUE);
    
    // MOD
    const tempsProductionTotal = b.moulage_h + b.finition_h;
    const mod = tempsProductionTotal * COUT_MOD_HORAIRE;
    
    // 2. COÛTS INDIRECTS
    const coutMachines = (b.moulage_h * COUT_MACHINE_MOULAGE_H) + (b.finition_h * COUT_MACHINE_FINITION_H);
    
    // Répartition des coûts fixes
    const tempsTotalMoulage = b.moulage_h * quantiteMensuelle;
    const tempsTotalFinition = b.finition_h * quantiteMensuelle;
    
    const tauxMoulage = CAPACITE_MOULAGE > 0 ? tempsTotalMoulage / CAPACITE_MOULAGE : 0;
    const tauxFinition = CAPACITE_FINITION > 0 ? tempsTotalFinition / CAPACITE_FINITION : 0;
    
    const coutAtelierUnitaire = quantiteMensuelle > 0 
        ? ((COUT_ATELIER_MOULAGE * tauxMoulage) + (COUT_ATELIER_FINITION * tauxFinition)) / quantiteMensuelle 
        : 0;
    
    const coutMachineFixeUnitaire = quantiteMensuelle > 0
        ? ((COUT_MACHINE_MOULAGE * tauxMoulage) + (COUT_MACHINE_FINITION * tauxFinition)) / quantiteMensuelle
        : 0;
    
    // 3. COÛT TOTAL
    const coutTotal = coutMatieres + mod + coutMachines + coutAtelierUnitaire + coutMachineFixeUnitaire;
    
    return {
        matieres: coutMatieres,
        mod: mod,
        coutsDirects: coutMatieres + mod,
        machines: coutMachines,
        ateliers: coutAtelierUnitaire,
        machinesFixes: coutMachineFixeUnitaire,
        coutsIndirects: coutMachines + coutAtelierUnitaire + coutMachineFixeUnitaire,
        total: coutTotal,
        tauxMoulage: tauxMoulage,
        tauxFinition: tauxFinition,
        tempsTotalMoulage: tempsTotalMoulage,
        tempsTotalFinition: tempsTotalFinition
    };
}

// ========== AFFICHAGE ==========

function formatNombre(nombre) {
    return nombre.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function calculerCouts() {
    // Récupérer les quantités
    const quantites = {
        "Pech 4": parseInt(document.getElementById("qte-pech4").value) || 0,
        "Prom 5.5": parseInt(document.getElementById("qte-prom55").value) || 0,
        "Stan 8": parseInt(document.getElementById("qte-stan8").value) || 0
    };
    
    // Calculer les coûts
    const resultats = {};
    for (const [bateau, qte] of Object.entries(quantites)) {
        resultats[bateau] = coutProduction(bateau, qte);
    }
    
    // Afficher le tableau
    afficherTableau(resultats, quantites);
    
    // Afficher les détails
    afficherDetails(resultats, quantites);
}

function afficherTableau(resultats, quantites) {
    const tbody = document.getElementById("tbody-resultats");
    tbody.innerHTML = "";
    
    let totalQuantite = 0;
    let totalMatieres = 0;
    let totalMOD = 0;
    let totalDirects = 0;
    let totalMachines = 0;
    let totalAteliers = 0;
    let totalMachinesFixes = 0;
    let totalIndirects = 0;
    let totalGeneral = 0;
    
    for (const [bateau, qte] of Object.entries(quantites)) {
        const res = resultats[bateau];
        
        totalQuantite += qte;
        totalMatieres += res.matieres * qte;
        totalMOD += res.mod * qte;
        totalDirects += res.coutsDirects * qte;
        totalMachines += res.machines * qte;
        totalAteliers += res.ateliers * qte;
        totalMachinesFixes += res.machinesFixes * qte;
        totalIndirects += res.coutsIndirects * qte;
        totalGeneral += res.total * qte;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${bateau}</strong></td>
            <td class="number">${qte}</td>
            <td class="number">${formatNombre(res.matieres)}</td>
            <td class="number">${formatNombre(res.mod)}</td>
            <td class="number"><strong>${formatNombre(res.coutsDirects)}</strong></td>
            <td class="number">${formatNombre(res.machines)}</td>
            <td class="number">${formatNombre(res.ateliers)}</td>
            <td class="number">${formatNombre(res.machinesFixes)}</td>
            <td class="number"><strong>${formatNombre(res.coutsIndirects)}</strong></td>
            <td class="number"><strong>${formatNombre(res.total)}</strong></td>
        `;
        tbody.appendChild(tr);
    }
    
    // Ligne de total
    const trTotal = document.createElement("tr");
    trTotal.className = "total-row";
    trTotal.innerHTML = `
        <td><strong>TOTAL</strong></td>
        <td class="number"><strong>${totalQuantite}</strong></td>
        <td class="number"><strong>${formatNombre(totalMatieres)}</strong></td>
        <td class="number"><strong>${formatNombre(totalMOD)}</strong></td>
        <td class="number"><strong>${formatNombre(totalDirects)}</strong></td>
        <td class="number"><strong>${formatNombre(totalMachines)}</strong></td>
        <td class="number"><strong>${formatNombre(totalAteliers)}</strong></td>
        <td class="number"><strong>${formatNombre(totalMachinesFixes)}</strong></td>
        <td class="number"><strong>${formatNombre(totalIndirects)}</strong></td>
        <td class="number"><strong>${formatNombre(totalGeneral)}</strong></td>
    `;
    tbody.appendChild(trTotal);
}

function afficherDetails(resultats, quantites) {
    const container = document.getElementById("details-container");
    container.innerHTML = "";
    
    for (const [bateau, qte] of Object.entries(quantites)) {
        if (qte === 0) continue;
        
        const res = resultats[bateau];
        const b = BATEAUX[bateau];
        
        const detailsDiv = document.createElement("div");
        detailsDiv.className = "details";
        detailsDiv.innerHTML = `
            <h3>${bateau} - Quantité: ${qte} unité(s)</h3>
            <div class="detail-item">
                <strong>Matières premières:</strong> ${formatNombre(res.matieres)} €
                (Bois: ${b.bois} m³ × ${formatNombre(PRIX_BOIS)}€ = ${formatNombre(b.bois * PRIX_BOIS)}€, 
                Plastique: ${b.plastique} t × ${formatNombre(PRIX_PLASTIQUE)}€ = ${formatNombre(b.plastique * PRIX_PLASTIQUE)}€)
            </div>
            <div class="detail-item">
                <strong>MOD:</strong> ${formatNombre(res.mod)} €
                (Temps: ${b.moulage_h + b.finition_h}h × ${formatNombre(COUT_MOD_HORAIRE)}€/h)
            </div>
            <div class="detail-item">
                <strong>Coûts directs:</strong> ${formatNombre(res.coutsDirects)} €
            </div>
            <div class="detail-item">
                <strong>Machines (variable):</strong> ${formatNombre(res.machines)} €
                (Moulage: ${b.moulage_h}h × ${COUT_MACHINE_MOULAGE_H}€, Finition: ${b.finition_h}h × ${COUT_MACHINE_FINITION_H}€)
            </div>
            <div class="detail-item">
                <strong>Ateliers (fixe):</strong> ${formatNombre(res.ateliers)} €
                (Temps total moulage: ${res.tempsTotalMoulage}h / ${CAPACITE_MOULAGE}h = ${(res.tauxMoulage * 100).toFixed(2)}%, 
                Temps total finition: ${res.tempsTotalFinition}h / ${CAPACITE_FINITION}h = ${(res.tauxFinition * 100).toFixed(2)}%)
            </div>
            <div class="detail-item">
                <strong>Machines fixes:</strong> ${formatNombre(res.machinesFixes)} €
            </div>
            <div class="detail-item">
                <strong>Coûts indirects:</strong> ${formatNombre(res.coutsIndirects)} €
            </div>
            <div class="detail-item">
                <strong>COÛT TOTAL:</strong> ${formatNombre(res.total)} €
            </div>
        `;
        container.appendChild(detailsDiv);
    }
}

// ========== CALCULS SAISONNIERS ==========

function calculerBeneficesMensuels() {
    const beneficesMensuels = [];
    const quantitesMensuelles = [];
    
    for (let mois = 0; mois < 12; mois++) {
        let revenusTotal = 0;
        let coutsTotal = 0;
        const quantitesMois = {};
        
        for (const bateau of Object.keys(BATEAUX)) {
            // Lire la quantité produite ce mois
            const quantiteInput = document.getElementById(`qte-${bateau.replace(/\s/g, '-').toLowerCase()}-mois-${mois}`);
            const quantiteVendue = parseInt(quantiteInput?.value) || 0;
            quantitesMois[bateau] = quantiteVendue;
            
            if (quantiteVendue > 0) {
                // Revenus
                const prixVente = BATEAUX[bateau].prixVente;
                revenusTotal += quantiteVendue * prixVente;
                
                // Coûts de production
                const couts = coutProduction(bateau, quantiteVendue);
                coutsTotal += couts.total * quantiteVendue;
            }
        }
        
        const benefice = revenusTotal - coutsTotal;
        beneficesMensuels.push(benefice);
        quantitesMensuelles.push(quantitesMois);
    }
    
    return { benefices: beneficesMensuels, quantites: quantitesMensuelles };
}

function initialiserTableauMensuel() {
    const tbody = document.getElementById("tbody-mensuel");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    for (let mois = 0; mois < 12; mois++) {
        const tr = document.createElement("tr");
        
        let html = `<td><strong>${MOIS[mois]}</strong></td>`;
        
        // Colonnes pour chaque type de bateau
        for (const bateau of Object.keys(BATEAUX)) {
            const bateauId = bateau.replace(/\s/g, '-').toLowerCase();
            const coeff = COEFFICIENTS_SAISONNIERS[bateau][mois];
            
            html += `
                <td>
                    <input type="number" 
                           id="qte-${bateauId}-mois-${mois}" 
                           value="0" 
                           min="0" 
                           step="1" 
                           class="input-quantite"
                           onchange="afficherGraphique()">
                </td>
                <td class="coeff-readonly">
                    ${coeff.toFixed(2)}
                </td>
            `;
        }
        
        tr.innerHTML = html;
        tbody.appendChild(tr);
    }
}

let chartInstance = null;

function afficherGraphique() {
    const resultats = calculerBeneficesMensuels();
    const benefices = resultats.benefices;
    const quantites = resultats.quantites;
    const ctx = document.getElementById('graphique-annuel');
    
    if (!ctx) return;
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: MOIS,
            datasets: [{
                label: 'Bénéfices (€)',
                data: benefices,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Bénéfices mensuels au fil de l\'année'
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const index = context.dataIndex;
                            const qtes = quantites[index];
                            return [
                                `Pech 4: ${Math.round(qtes["Pech 4"])} unités`,
                                `Prom 5.5: ${Math.round(qtes["Prom 5.5"])} unités`,
                                `Stan 8: ${Math.round(qtes["Stan 8"])} unités`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Bénéfices (€)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatNombre(value) + ' €';
                        }
                    }
                }
            }
        }
    });
}

// Calculer au chargement de la page
window.onload = function() {
    calculerCouts();
    initialiserTableauMensuel();
    afficherGraphique();
};


