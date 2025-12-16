// ========== DONNÉES ==========

// Fonction pour obtenir le prix du bois depuis l'interface
function getPrixBois() {
    const input = document.getElementById("prix-bois");
    return input ? parseFloat(input.value) || 2150 : 2150;
}

// Fonction pour obtenir le prix du plastique depuis l'interface
function getPrixPlastique() {
    const input = document.getElementById("prix-plastique");
    return input ? parseFloat(input.value) || 5200 : 5200;
}

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
    const prixBois = getPrixBois();
    const prixPlastique = getPrixPlastique();
    const coutMatieres = (b.bois * prixBois) + (b.plastique * prixPlastique);
    
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
        tempsMoulageUnitaire: b.moulage_h,
        tempsFinitionUnitaire: b.finition_h,
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
    const tbodyDirects = document.getElementById("tbody-resultats-directs");
    const tbodyCapacites = document.getElementById("tbody-resultats-capacites");
    const tbodyIndirects = document.getElementById("tbody-resultats-indirects");
    tbodyDirects.innerHTML = "";
    tbodyCapacites.innerHTML = "";
    tbodyIndirects.innerHTML = "";
    
    // Constantes pour calculer le nombre de machines
    const NB_MACHINES_MOULAGE = 7;
    const NB_MACHINES_FINITION = 8;
    const CAPACITE_MACHINE_MOULAGE = CAPACITE_MOULAGE / NB_MACHINES_MOULAGE; // 200 h/mois par machine
    const CAPACITE_MACHINE_FINITION = CAPACITE_FINITION / NB_MACHINES_FINITION; // 200 h/mois par machine
    const PRIX_MACHINE_MOULAGE = COUT_MACHINE_MOULAGE / NB_MACHINES_MOULAGE; // 10000 €/mois par machine
    const PRIX_MACHINE_FINITION = COUT_MACHINE_FINITION / NB_MACHINES_FINITION; // 5000 €/mois par machine
    
    let totalQuantite = 0;
    let totalMatieres = 0;
    let totalMOD = 0;
    let totalDirects = 0;
    let totalTempsTotal = 0;
    let totalTempsMoulage = 0;
    let totalTempsFinition = 0;
    let totalPrixMachinesMoulage = 0;
    let totalPrixMachinesFinition = 0;
    let totalPrixMachinesTotal = 0;
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
        totalTempsTotal += res.tempsTotalMoulage + res.tempsTotalFinition;
        totalTempsMoulage += res.tempsTotalMoulage;
        totalTempsFinition += res.tempsTotalFinition;
        totalMachines += res.machines * qte;
        totalAteliers += res.ateliers * qte;
        totalMachinesFixes += res.machinesFixes * qte;
        totalIndirects += res.coutsIndirects * qte;
        totalGeneral += res.total * qte;
        
        // Calculer les totaux pour cette quantité de bateaux
        const totalMatieresBateau = res.matieres * qte;
        const totalMODBateau = res.mod * qte;
        const totalDirectsBateau = res.coutsDirects * qte;
        const totalTempsTotalBateau = res.tempsTotalMoulage + res.tempsTotalFinition;
        const pourcentageMoulage = res.tauxMoulage * 100;
        const pourcentageFinition = res.tauxFinition * 100;
        
        // Calculer le nombre de machines nécessaires (arrondi au supérieur)
        const nbMachinesMoulage = Math.ceil(res.tempsTotalMoulage / CAPACITE_MACHINE_MOULAGE);
        const nbMachinesFinition = Math.ceil(res.tempsTotalFinition / CAPACITE_MACHINE_FINITION);
        
        // Calculer le prix des machines nécessaires
        const prixMachinesMoulage = nbMachinesMoulage * PRIX_MACHINE_MOULAGE;
        const prixMachinesFinition = nbMachinesFinition * PRIX_MACHINE_FINITION;
        const prixMachinesTotal = prixMachinesMoulage + prixMachinesFinition;
        
        totalPrixMachinesMoulage += prixMachinesMoulage;
        totalPrixMachinesFinition += prixMachinesFinition;
        totalPrixMachinesTotal += prixMachinesTotal;
        
        const totalMachinesBateau = res.machines * qte;
        const totalAteliersBateau = res.ateliers * qte;
        const totalMachinesFixesBateau = res.machinesFixes * qte;
        const totalIndirectsBateau = res.coutsIndirects * qte;
        const totalGeneralBateau = res.total * qte;
        
        // Tableau des coûts directs
        const trDirects = document.createElement("tr");
        trDirects.innerHTML = `
            <td><strong>${bateau}</strong></td>
            <td class="number">${qte}</td>
            <td class="number">${formatNombre(totalMatieresBateau)}</td>
            <td class="number">${formatNombre(totalMODBateau)}</td>
            <td class="number"><strong>${formatNombre(totalDirectsBateau)}</strong></td>
            <td class="number"><strong>${formatNombre(totalTempsTotalBateau)}</strong></td>
        `;
        tbodyDirects.appendChild(trDirects);
        
        // Tableau des capacités et machines
        const trCapacites = document.createElement("tr");
        trCapacites.innerHTML = `
            <td><strong>${bateau}</strong></td>
            <td class="number">${qte}</td>
            <td class="number">${pourcentageMoulage.toFixed(2)}%</td>
            <td class="number">${pourcentageFinition.toFixed(2)}%</td>
            <td class="number">${nbMachinesMoulage}</td>
            <td class="number">${nbMachinesFinition}</td>
            <td class="number">${formatNombre(prixMachinesMoulage)}</td>
            <td class="number">${formatNombre(prixMachinesFinition)}</td>
            <td class="number"><strong>${formatNombre(prixMachinesTotal)}</strong></td>
        `;
        tbodyCapacites.appendChild(trCapacites);
        
        // Tableau des coûts indirects
        const trIndirects = document.createElement("tr");
        trIndirects.innerHTML = `
            <td><strong>${bateau}</strong></td>
            <td class="number">${qte}</td>
            <td class="number">${formatNombre(totalMachinesBateau)}</td>
            <td class="number">${formatNombre(totalAteliersBateau)}</td>
            <td class="number">${formatNombre(totalMachinesFixesBateau)}</td>
            <td class="number"><strong>${formatNombre(totalIndirectsBateau)}</strong></td>
            <td class="number"><strong>${formatNombre(totalGeneralBateau)}</strong></td>
        `;
        tbodyIndirects.appendChild(trIndirects);
    }
    
    // Calculer les pourcentages totaux et nombre de machines total
    const pourcentageMoulageTotal = totalTempsMoulage > 0 ? (totalTempsMoulage / CAPACITE_MOULAGE) * 100 : 0;
    const pourcentageFinitionTotal = totalTempsFinition > 0 ? (totalTempsFinition / CAPACITE_FINITION) * 100 : 0;
    const nbMachinesMoulageTotal = Math.ceil(totalTempsMoulage / CAPACITE_MACHINE_MOULAGE);
    const nbMachinesFinitionTotal = Math.ceil(totalTempsFinition / CAPACITE_MACHINE_FINITION);
    
    // Ligne de total - Tableau des coûts directs
    const trTotalDirects = document.createElement("tr");
    trTotalDirects.className = "total-row";
    trTotalDirects.innerHTML = `
        <td><strong>TOTAL</strong></td>
        <td class="number"><strong>${totalQuantite}</strong></td>
        <td class="number"><strong>${formatNombre(totalMatieres)}</strong></td>
        <td class="number"><strong>${formatNombre(totalMOD)}</strong></td>
        <td class="number"><strong>${formatNombre(totalDirects)}</strong></td>
        <td class="number"><strong>${formatNombre(totalTempsTotal)}</strong></td>
    `;
    tbodyDirects.appendChild(trTotalDirects);
    
    // Calculer le prix total des machines pour la ligne TOTAL
    const prixMachinesMoulageTotal = nbMachinesMoulageTotal * PRIX_MACHINE_MOULAGE;
    const prixMachinesFinitionTotal = nbMachinesFinitionTotal * PRIX_MACHINE_FINITION;
    const prixMachinesTotalTotal = prixMachinesMoulageTotal + prixMachinesFinitionTotal;
    
    // Ligne de total - Tableau des capacités
    const trTotalCapacites = document.createElement("tr");
    trTotalCapacites.className = "total-row";
    trTotalCapacites.innerHTML = `
        <td><strong>TOTAL</strong></td>
        <td class="number"><strong>${totalQuantite}</strong></td>
        <td class="number"><strong>${pourcentageMoulageTotal.toFixed(2)}%</strong></td>
        <td class="number"><strong>${pourcentageFinitionTotal.toFixed(2)}%</strong></td>
        <td class="number"><strong>${nbMachinesMoulageTotal}</strong></td>
        <td class="number"><strong>${nbMachinesFinitionTotal}</strong></td>
        <td class="number"><strong>${formatNombre(prixMachinesMoulageTotal)}</strong></td>
        <td class="number"><strong>${formatNombre(prixMachinesFinitionTotal)}</strong></td>
        <td class="number"><strong>${formatNombre(prixMachinesTotalTotal)}</strong></td>
    `;
    tbodyCapacites.appendChild(trTotalCapacites);
    
    // Ligne de total - Tableau des coûts indirects
    const trTotalIndirects = document.createElement("tr");
    trTotalIndirects.className = "total-row";
    trTotalIndirects.innerHTML = `
        <td><strong>TOTAL</strong></td>
        <td class="number"><strong>${totalQuantite}</strong></td>
        <td class="number"><strong>${formatNombre(totalMachines)}</strong></td>
        <td class="number"><strong>${formatNombre(totalAteliers)}</strong></td>
        <td class="number"><strong>${formatNombre(totalMachinesFixes)}</strong></td>
        <td class="number"><strong>${formatNombre(totalIndirects)}</strong></td>
        <td class="number"><strong>${formatNombre(totalGeneral)}</strong></td>
    `;
    tbodyIndirects.appendChild(trTotalIndirects);
}

function afficherDetails(resultats, quantites) {
    const container = document.getElementById("details-container");
    container.innerHTML = "";
    
    // Afficher un détail pour chaque bateau avec les totaux
    for (const [bateau, qte] of Object.entries(quantites)) {
        if (qte === 0) continue;
        
        const res = resultats[bateau];
        const b = BATEAUX[bateau];
        
        // Calculer les totaux pour ce bateau (quantité × coût unitaire)
        const totalMatieres = res.matieres * qte;
        const totalMOD = res.mod * qte;
        const totalDirects = res.coutsDirects * qte;
        const totalMachinesMoulage = b.moulage_h * qte * COUT_MACHINE_MOULAGE_H;
        const totalMachinesFinition = b.finition_h * qte * COUT_MACHINE_FINITION_H;
        const totalMachines = res.machines * qte;
        const totalAteliers = res.ateliers * qte;
        const totalMachinesFixes = res.machinesFixes * qte;
        const totalIndirects = res.coutsIndirects * qte;
        const totalGeneral = res.total * qte;
        const totalTempsMoulage = res.tempsTotalMoulage;
        const totalTempsFinition = res.tempsTotalFinition;
        const totalBois = b.bois * qte;
        const totalPlastique = b.plastique * qte;
        const totalTempsProduction = (b.moulage_h + b.finition_h) * qte;
        
        // Calculer les taux d'utilisation pour ce bateau
        const tauxMoulage = res.tauxMoulage;
        const tauxFinition = res.tauxFinition;
        
        // Calculer le coût MOD horaire pour l'affichage
        const modHoraire = COUT_MOD_HORAIRE;
        
        // Afficher le détail pour ce bateau
        const detailsDiv = document.createElement("div");
        detailsDiv.className = "details";
        detailsDiv.innerHTML = `
            <h3>${bateau} - Quantité: ${qte} unité(s)</h3>
            <div class="detail-item">
                <strong>Matières premières:</strong> ${formatNombre(totalMatieres)} €
                <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>Bois: ${formatNombre(totalBois)} m³ × ${formatNombre(getPrixBois())}€/m³ = ${formatNombre(totalBois * getPrixBois())}€</li>
                    <li>Plastique: ${formatNombre(totalPlastique)} t × ${formatNombre(getPrixPlastique())}€/t = ${formatNombre(totalPlastique * getPrixPlastique())}€</li>
                </ul>
            </div>
            <div class="detail-item">
                <strong>MOD:</strong> ${formatNombre(totalMOD)} €
                (Temps: ${formatNombre(totalTempsProduction)}h × ${formatNombre(modHoraire)}€/h)
            </div>
            <div class="detail-item">
                <strong>Coûts directs:</strong> ${formatNombre(totalDirects)} €
            </div>
            <div class="detail-item">
                <strong>Machines (variable):</strong> ${formatNombre(totalMachines)} €
                <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>Moulage: ${formatNombre(totalTempsMoulage)}h × ${COUT_MACHINE_MOULAGE_H}€/h = ${formatNombre(totalMachinesMoulage)}€</li>
                    <li>Finition: ${formatNombre(totalTempsFinition)}h × ${COUT_MACHINE_FINITION_H}€/h = ${formatNombre(totalMachinesFinition)}€</li>
                </ul>
            </div>
            <div class="detail-item">
                <strong>Ateliers (fixe):</strong> ${formatNombre(totalAteliers)} €
                <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>Temps total moulage: ${formatNombre(totalTempsMoulage)}h / ${CAPACITE_MOULAGE}h = ${(tauxMoulage * 100).toFixed(2)}%</li>
                    <li>Temps total finition: ${formatNombre(totalTempsFinition)}h / ${CAPACITE_FINITION}h = ${(tauxFinition * 100).toFixed(2)}%</li>
                </ul>
            </div>
            <div class="detail-item">
                <strong>Machines fixes:</strong> ${formatNombre(totalMachinesFixes)} €
            </div>
            <div class="detail-item">
                <strong>Coûts indirects:</strong> ${formatNombre(totalIndirects)} €
            </div>
            <div class="detail-item">
                <strong>COÛT TOTAL:</strong> ${formatNombre(totalGeneral)} €
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


