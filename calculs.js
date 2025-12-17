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

// Fonction pour obtenir le stock de bois disponible
function getStockBois() {
    const input = document.getElementById("stock-bois");
    return input ? parseFloat(input.value) || 0 : 0;
}

// Fonction pour obtenir le stock de plastique disponible
function getStockPlastique() {
    const input = document.getElementById("stock-plastique");
    return input ? parseFloat(input.value) || 0 : 0;
}

const BATEAUX = {
    "Pech 4": { bois: 0.1, plastique: 0.2, moulage_h: 8, finition_h: 10, prixVente: 6000 },
    "Prom 5.5": { bois: 0.2, plastique: 0.4, moulage_h: 12, finition_h: 14, prixVente: 12000 },
    "Stan 8": { bois: 0.5, plastique: 1.0, moulage_h: 28, finition_h: 28, prixVente: 35000 }
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
const COUT_MACHINE_MOULAGE_UNITAIRE = 10000; // €/mois par machine
const COUT_MACHINE_FINITION_UNITAIRE = 5000; // €/mois par machine
const CAPACITE_MACHINE_UNITAIRE = 200; // h/mois par machine

// Fonctions pour obtenir le nombre de machines depuis l'interface
function getNbMachinesMoulage() {
    const input = document.getElementById("nb-machines-moulage");
    return input ? parseInt(input.value) || 7 : 7;
}

function getNbMachinesFinition() {
    const input = document.getElementById("nb-machines-finition");
    return input ? parseInt(input.value) || 8 : 8;
}

// Fonctions pour calculer les capacités et coûts dynamiquement
function getCapaciteMoulage() {
    return getNbMachinesMoulage() * CAPACITE_MACHINE_UNITAIRE;
}

function getCapaciteFinition() {
    return getNbMachinesFinition() * CAPACITE_MACHINE_UNITAIRE;
}

function getCoutMachineMoulage() {
    return getNbMachinesMoulage() * COUT_MACHINE_MOULAGE_UNITAIRE;
}

function getCoutMachineFinition() {
    return getNbMachinesFinition() * COUT_MACHINE_FINITION_UNITAIRE;
}

// MOD
const NB_EMPLOYES_PRODUCTION = 5;
const SALAIRE_EMPLOYE_PRODUCTION = 2000; // €/mois
const HEURES_MOIS = 151.67; // heures/mois
const COUT_MOD_TOTAL_MENSUEL = NB_EMPLOYES_PRODUCTION * SALAIRE_EMPLOYE_PRODUCTION;
const COUT_MOD_HORAIRE = COUT_MOD_TOTAL_MENSUEL / (NB_EMPLOYES_PRODUCTION * HEURES_MOIS);

// ========== FONCTIONS DE CALCUL ==========

function coutProduction(nomBateau, quantiteMensuelle, utiliserStock = false, stockBoisDispo = 0, stockPlastiqueDispo = 0) {
    const b = BATEAUX[nomBateau];
    
    // 1. COÛTS DIRECTS
    const prixBois = getPrixBois();
    const prixPlastique = getPrixPlastique();
    
    // Calculer les besoins totaux
    const besoinBois = b.bois * quantiteMensuelle;
    const besoinPlastique = b.plastique * quantiteMensuelle;
    
    // Si on utilise le stock, calculer ce qu'il faut acheter
    let boisAcheter = besoinBois;
    let plastiqueAcheter = besoinPlastique;
    let boisUtiliseStock = 0;
    let plastiqueUtiliseStock = 0;
    
    if (utiliserStock) {
        boisUtiliseStock = Math.min(besoinBois, stockBoisDispo);
        plastiqueUtiliseStock = Math.min(besoinPlastique, stockPlastiqueDispo);
        boisAcheter = Math.max(0, besoinBois - stockBoisDispo);
        plastiqueAcheter = Math.max(0, besoinPlastique - stockPlastiqueDispo);
    }
    
    const coutMatieres = (boisAcheter * prixBois) + (plastiqueAcheter * prixPlastique);
    
    // MOD
    const tempsProductionTotal = b.moulage_h + b.finition_h;
    const mod = tempsProductionTotal * COUT_MOD_HORAIRE;
    
    // 2. COÛTS INDIRECTS
    const coutMachines = (b.moulage_h * COUT_MACHINE_MOULAGE_H) + (b.finition_h * COUT_MACHINE_FINITION_H);
    
    // Répartition des coûts fixes
    const tempsTotalMoulage = b.moulage_h * quantiteMensuelle;
    const tempsTotalFinition = b.finition_h * quantiteMensuelle;
    
    const capaciteMoulage = getCapaciteMoulage();
    const capaciteFinition = getCapaciteFinition();
    
    const tauxMoulage = capaciteMoulage > 0 ? tempsTotalMoulage / capaciteMoulage : 0;
    const tauxFinition = capaciteFinition > 0 ? tempsTotalFinition / capaciteFinition : 0;
    
    const coutAtelierUnitaire = quantiteMensuelle > 0 
        ? ((COUT_ATELIER_MOULAGE * tauxMoulage) + (COUT_ATELIER_FINITION * tauxFinition)) / quantiteMensuelle 
        : 0;
    
    const coutMachineFixeUnitaire = quantiteMensuelle > 0
        ? ((getCoutMachineMoulage() * tauxMoulage) + (getCoutMachineFinition() * tauxFinition)) / quantiteMensuelle
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
        tempsTotalFinition: tempsTotalFinition,
        // Informations sur le stock
        besoinBois: besoinBois,
        besoinPlastique: besoinPlastique,
        boisAcheter: boisAcheter,
        plastiqueAcheter: plastiqueAcheter,
        boisUtiliseStock: boisUtiliseStock,
        plastiqueUtiliseStock: plastiqueUtiliseStock
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
    
    // Récupérer les stocks disponibles
    const stockBois = getStockBois();
    const stockPlastique = getStockPlastique();
    
    // Calculer d'abord les besoins totaux
    let besoinBoisTotal = 0;
    let besoinPlastiqueTotal = 0;
    for (const [bateau, qte] of Object.entries(quantites)) {
        const b = BATEAUX[bateau];
        besoinBoisTotal += b.bois * qte;
        besoinPlastiqueTotal += b.plastique * qte;
    }
    
    // Calculer les coûts en tenant compte du stock
    const resultats = {};
    let stockBoisRestant = stockBois;
    let stockPlastiqueRestant = stockPlastique;
    
    for (const [bateau, qte] of Object.entries(quantites)) {
        resultats[bateau] = coutProduction(bateau, qte, true, stockBoisRestant, stockPlastiqueRestant);
        // Mettre à jour le stock restant
        stockBoisRestant = Math.max(0, stockBoisRestant - resultats[bateau].besoinBois);
        stockPlastiqueRestant = Math.max(0, stockPlastiqueRestant - resultats[bateau].besoinPlastique);
    }
    
    // Afficher le tableau
    afficherTableau(resultats, quantites);
    
    // Afficher les détails
    afficherDetails(resultats, quantites);
    
    // Afficher l'analyse des stocks
    afficherAnalyseStock(resultats, quantites, besoinBoisTotal, besoinPlastiqueTotal, stockBois, stockPlastique);
    
    // Recalculer les analyses
    analyserRentabilite();
    calculerMixOptimal();
    calculerStrategieAnnuelle();
}

function afficherTableau(resultats, quantites) {
    const tbodyDirects = document.getElementById("tbody-resultats-directs");
    const tbodyCapacites = document.getElementById("tbody-resultats-capacites");
    const tbodyIndirects = document.getElementById("tbody-resultats-indirects");
    tbodyDirects.innerHTML = "";
    tbodyCapacites.innerHTML = "";
    tbodyIndirects.innerHTML = "";
    
    // Récupérer les valeurs dynamiques
    const capaciteMoulage = getCapaciteMoulage();
    const capaciteFinition = getCapaciteFinition();
    const CAPACITE_MACHINE_MOULAGE = CAPACITE_MACHINE_UNITAIRE; // 200 h/mois par machine
    const CAPACITE_MACHINE_FINITION = CAPACITE_MACHINE_UNITAIRE; // 200 h/mois par machine
    const PRIX_MACHINE_MOULAGE = COUT_MACHINE_MOULAGE_UNITAIRE; // 10000 €/mois par machine
    const PRIX_MACHINE_FINITION = COUT_MACHINE_FINITION_UNITAIRE; // 5000 €/mois par machine
    
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
    const pourcentageMoulageTotal = totalTempsMoulage > 0 ? (totalTempsMoulage / capaciteMoulage) * 100 : 0;
    const pourcentageFinitionTotal = totalTempsFinition > 0 ? (totalTempsFinition / capaciteFinition) * 100 : 0;
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
    
    // Ajouter un style pour les pourcentages dépassés
    const styleMoulage = pourcentageMoulageTotal > 100 ? "color: #F44336; font-weight: 700;" : "";
    const styleFinition = pourcentageFinitionTotal > 100 ? "color: #F44336; font-weight: 700;" : "";
    
    trTotalCapacites.innerHTML = `
        <td><strong>TOTAL</strong></td>
        <td class="number"><strong>${totalQuantite}</strong></td>
        <td class="number" style="${styleMoulage}"><strong>${pourcentageMoulageTotal.toFixed(2)}%</strong></td>
        <td class="number" style="${styleFinition}"><strong>${pourcentageFinitionTotal.toFixed(2)}%</strong></td>
        <td class="number"><strong>${nbMachinesMoulageTotal}</strong></td>
        <td class="number"><strong>${nbMachinesFinitionTotal}</strong></td>
        <td class="number"><strong>${formatNombre(prixMachinesMoulageTotal)}</strong></td>
        <td class="number"><strong>${formatNombre(prixMachinesFinitionTotal)}</strong></td>
        <td class="number"><strong>${formatNombre(prixMachinesTotalTotal)}</strong></td>
    `;
    tbodyCapacites.appendChild(trTotalCapacites);
    
    // Ajouter un avertissement si capacité dépassée
    if (pourcentageMoulageTotal > 100 || pourcentageFinitionTotal > 100) {
        const trWarning = document.createElement("tr");
        trWarning.innerHTML = `
            <td colspan="9" style="background: rgba(244, 67, 54, 0.1); padding: 16px; border: 2px solid #F44336; text-align: center;">
                <strong style="color: #F44336;">⚠️ ATTENTION: Capacité de production dépassée!</strong><br>
                <span style="font-size: 14px; color: #000;">
                    ${pourcentageMoulageTotal > 100 ? `Moulage: ${pourcentageMoulageTotal.toFixed(2)}% (limite: 100%). ` : ''}
                    ${pourcentageFinitionTotal > 100 ? `Finition: ${pourcentageFinitionTotal.toFixed(2)}% (limite: 100%). ` : ''}
                    Réduisez les quantités ou augmentez le nombre de machines.
                </span>
            </td>
        `;
        tbodyCapacites.appendChild(trWarning);
    }
    
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
                    <li>Bois besoin total: ${formatNombre(res.besoinBois)} m³
                        ${res.boisUtiliseStock > 0 ? `<br>&nbsp;&nbsp;&nbsp;→ Stock utilisé: ${formatNombre(res.boisUtiliseStock)} m³` : ''}
                        <br>&nbsp;&nbsp;&nbsp;→ À acheter: ${formatNombre(res.boisAcheter)} m³ × ${formatNombre(getPrixBois())}€/m³ = ${formatNombre(res.boisAcheter * getPrixBois())}€
                    </li>
                    <li>Plastique besoin total: ${formatNombre(res.besoinPlastique)} t
                        ${res.plastiqueUtiliseStock > 0 ? `<br>&nbsp;&nbsp;&nbsp;→ Stock utilisé: ${formatNombre(res.plastiqueUtiliseStock)} t` : ''}
                        <br>&nbsp;&nbsp;&nbsp;→ À acheter: ${formatNombre(res.plastiqueAcheter)} t × ${formatNombre(getPrixPlastique())}€/t = ${formatNombre(res.plastiqueAcheter * getPrixPlastique())}€
                    </li>
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
                    <li>Temps total moulage: ${formatNombre(totalTempsMoulage)}h / ${getCapaciteMoulage()}h = ${(tauxMoulage * 100).toFixed(2)}%</li>
                    <li>Temps total finition: ${formatNombre(totalTempsFinition)}h / ${getCapaciteFinition()}h = ${(tauxFinition * 100).toFixed(2)}%</li>
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

// ========== ANALYSE DES STOCKS ==========

function afficherAnalyseStock(resultats, quantites, besoinBoisTotal, besoinPlastiqueTotal, stockBois, stockPlastique) {
    const container = document.getElementById("analyse-stock-container");
    if (!container) return;
    
    const prixBois = getPrixBois();
    const prixPlastique = getPrixPlastique();
    
    // Calculer ce qu'il faut acheter
    const boisAcheter = Math.max(0, besoinBoisTotal - stockBois);
    const plastiqueAcheter = Math.max(0, besoinPlastiqueTotal - stockPlastique);
    
    // Calculer ce qui sera utilisé du stock
    const boisUtilise = Math.min(besoinBoisTotal, stockBois);
    const plastiqueUtilise = Math.min(besoinPlastiqueTotal, stockPlastique);
    
    // Calculer le stock restant
    const stockBoisRestant = Math.max(0, stockBois - besoinBoisTotal);
    const stockPlastiqueRestant = Math.max(0, stockPlastique - besoinPlastiqueTotal);
    
    // Calculer les coûts
    const coutAchatBois = boisAcheter * prixBois;
    const coutAchatPlastique = plastiqueAcheter * prixPlastique;
    const coutAchatTotal = coutAchatBois + coutAchatPlastique;
    
    // Calculer les économies grâce au stock
    const economiesStock = (boisUtilise * prixBois) + (plastiqueUtilise * prixPlastique);
    
    let html = `
        <h3>📦 Analyse des stocks et besoins en matières premières</h3>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
            <!-- Bois -->
            <div style="background: linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(139, 69, 19, 0.15) 100%); border-radius: 12px; padding: 20px;">
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <span style="font-size: 32px; margin-right: 12px;">🪵</span>
                    <h4 style="margin: 0; color: #8B4513;">Bois</h4>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                    <div style="font-size: 13px; color: #6e6e73;">Stock disponible</div>
                    <div style="font-size: 24px; font-weight: 600; color: #000;">${formatNombre(stockBois)} m³</div>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                    <div style="font-size: 13px; color: #6e6e73;">Besoin total pour production</div>
                    <div style="font-size: 24px; font-weight: 600; color: #000;">${formatNombre(besoinBoisTotal)} m³</div>
                </div>
                
                <div style="background: ${boisUtilise > 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(0, 0, 0, 0.05)'}; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                    <div style="font-size: 13px; color: #6e6e73;">Utilisé du stock</div>
                    <div style="font-size: 20px; font-weight: 600; color: ${boisUtilise > 0 ? '#4CAF50' : '#6e6e73'};">
                        ${formatNombre(boisUtilise)} m³
                    </div>
                    ${boisUtilise > 0 ? `<div style="font-size: 12px; color: #6e6e73; margin-top: 4px;">Économie: ${formatNombre(boisUtilise * prixBois)} €</div>` : ''}
                </div>
                
                <div style="background: ${boisAcheter > 0 ? 'rgba(255, 152, 0, 0.2)' : 'rgba(76, 175, 80, 0.2)'}; border: 2px solid ${boisAcheter > 0 ? '#FF9800' : '#4CAF50'}; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                    <div style="font-size: 13px; color: #6e6e73;">À acheter</div>
                    <div style="font-size: 24px; font-weight: 700; color: ${boisAcheter > 0 ? '#FF9800' : '#4CAF50'};">
                        ${formatNombre(boisAcheter)} m³
                    </div>
                    <div style="font-size: 14px; color: #000; margin-top: 4px; font-weight: 600;">
                        Coût: ${formatNombre(coutAchatBois)} €
                    </div>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 12px;">
                    <div style="font-size: 13px; color: #6e6e73;">Stock restant après production</div>
                    <div style="font-size: 18px; font-weight: 600; color: #000;">${formatNombre(stockBoisRestant)} m³</div>
                </div>
            </div>
            
            <!-- Plastique -->
            <div style="background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.15) 100%); border-radius: 12px; padding: 20px;">
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <span style="font-size: 32px; margin-right: 12px;">♻️</span>
                    <h4 style="margin: 0; color: #4CAF50;">Plastique</h4>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                    <div style="font-size: 13px; color: #6e6e73;">Stock disponible</div>
                    <div style="font-size: 24px; font-weight: 600; color: #000;">${formatNombre(stockPlastique)} t</div>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                    <div style="font-size: 13px; color: #6e6e73;">Besoin total pour production</div>
                    <div style="font-size: 24px; font-weight: 600; color: #000;">${formatNombre(besoinPlastiqueTotal)} t</div>
                </div>
                
                <div style="background: ${plastiqueUtilise > 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(0, 0, 0, 0.05)'}; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                    <div style="font-size: 13px; color: #6e6e73;">Utilisé du stock</div>
                    <div style="font-size: 20px; font-weight: 600; color: ${plastiqueUtilise > 0 ? '#4CAF50' : '#6e6e73'};">
                        ${formatNombre(plastiqueUtilise)} t
                    </div>
                    ${plastiqueUtilise > 0 ? `<div style="font-size: 12px; color: #6e6e73; margin-top: 4px;">Économie: ${formatNombre(plastiqueUtilise * prixPlastique)} €</div>` : ''}
                </div>
                
                <div style="background: ${plastiqueAcheter > 0 ? 'rgba(255, 152, 0, 0.2)' : 'rgba(76, 175, 80, 0.2)'}; border: 2px solid ${plastiqueAcheter > 0 ? '#FF9800' : '#4CAF50'}; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                    <div style="font-size: 13px; color: #6e6e73;">À acheter</div>
                    <div style="font-size: 24px; font-weight: 700; color: ${plastiqueAcheter > 0 ? '#FF9800' : '#4CAF50'};">
                        ${formatNombre(plastiqueAcheter)} t
                    </div>
                    <div style="font-size: 14px; color: #000; margin-top: 4px; font-weight: 600;">
                        Coût: ${formatNombre(coutAchatPlastique)} €
                    </div>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 12px;">
                    <div style="font-size: 13px; color: #6e6e73;">Stock restant après production</div>
                    <div style="font-size: 18px; font-weight: 600; color: #000;">${formatNombre(stockPlastiqueRestant)} t</div>
                </div>
            </div>
        </div>
        
        <!-- Résumé financier -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 16px; padding: 24px;">
            <h4 style="margin-top: 0; color: white;">💰 Résumé financier - Achats de matières premières</h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center;">
                <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 16px;">
                    <div style="font-size: 14px; opacity: 0.9;">Coût total des achats</div>
                    <div style="font-size: 32px; font-weight: 700; margin-top: 8px;">${formatNombre(coutAchatTotal)} €</div>
                </div>
                <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 16px;">
                    <div style="font-size: 14px; opacity: 0.9;">Économies grâce au stock</div>
                    <div style="font-size: 32px; font-weight: 700; margin-top: 8px; color: #4CAF50;">${formatNombre(economiesStock)} €</div>
                </div>
                <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 16px;">
                    <div style="font-size: 14px; opacity: 0.9;">Coût si sans stock</div>
                    <div style="font-size: 28px; font-weight: 700; margin-top: 8px; opacity: 0.7;">${formatNombre(coutAchatTotal + economiesStock)} €</div>
                </div>
            </div>
        </div>
        
        <!-- Détails par bateau -->
        <div style="margin-top: 24px;">
            <h4 style="color: #000;">📊 Détail par type de bateau</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
    `;
    
    for (const [nomBateau, qte] of Object.entries(quantites)) {
        if (qte === 0) continue;
        
        const res = resultats[nomBateau];
        const specs = BATEAUX[nomBateau];
        
        html += `
            <div style="background: rgba(255, 255, 255, 0.7); border-radius: 12px; padding: 16px; border: 1px solid rgba(0, 0, 0, 0.1);">
                <strong style="font-size: 16px; color: #000;">${nomBateau} (${qte} unité${qte > 1 ? 's' : ''})</strong>
                <div style="margin-top: 12px; font-size: 13px;">
                    <div style="padding: 8px; background: rgba(139, 69, 19, 0.05); border-radius: 6px; margin-bottom: 6px;">
                        <strong>🪵 Bois:</strong><br>
                        <span style="color: #6e6e73;">
                            Besoin: ${formatNombre(res.besoinBois)} m³<br>
                            ${res.boisUtiliseStock > 0 ? `Stock utilisé: ${formatNombre(res.boisUtiliseStock)} m³<br>` : ''}
                            ${res.boisAcheter > 0 ? `À acheter: ${formatNombre(res.boisAcheter)} m³ (${formatNombre(res.boisAcheter * prixBois)} €)` : 'Couvert par le stock ✅'}
                        </span>
                    </div>
                    <div style="padding: 8px; background: rgba(76, 175, 80, 0.05); border-radius: 6px;">
                        <strong>♻️ Plastique:</strong><br>
                        <span style="color: #6e6e73;">
                            Besoin: ${formatNombre(res.besoinPlastique)} t<br>
                            ${res.plastiqueUtiliseStock > 0 ? `Stock utilisé: ${formatNombre(res.plastiqueUtiliseStock)} t<br>` : ''}
                            ${res.plastiqueAcheter > 0 ? `À acheter: ${formatNombre(res.plastiqueAcheter)} t (${formatNombre(res.plastiqueAcheter * prixPlastique)} €)` : 'Couvert par le stock ✅'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ========== ANALYSE DE RENTABILITÉ ==========

function analyserRentabilite() {
    const container = document.getElementById("analyse-rentabilite-container");
    if (!container) return;
    
    container.innerHTML = "";
    
    // Analyser chaque type de bateau
    const analyses = {};
    
    for (const [nomBateau, specs] of Object.entries(BATEAUX)) {
        const couts = coutProduction(nomBateau, 1);
        const prixVente = specs.prixVente;
        
        // Calculer les marges avec coefficients
        const coeffs = COEFFICIENTS_SAISONNIERS[nomBateau];
        const prixVenteMoyenPondere = prixVente * (coeffs.reduce((a, b) => a + b, 0) / 12);
        const margeBrute = prixVente - couts.total;
        const margeBrutePonderee = prixVenteMoyenPondere - couts.total;
        const tauxMarge = (margeBrute / prixVente) * 100;
        const tauxMargePondere = (margeBrutePonderee / prixVenteMoyenPondere) * 100;
        
        // Calculer la rentabilité par heure de production
        const tempsTotalProduction = specs.moulage_h + specs.finition_h;
        const rentabiliteParHeure = margeBrute / tempsTotalProduction;
        const rentabiliteParHeurePonderee = margeBrutePonderee / tempsTotalProduction;
        
        // Calculer le nombre max de bateaux selon les contraintes de machines
        const capaciteMoulage = getCapaciteMoulage();
        const capaciteFinition = getCapaciteFinition();
        const maxMoulage = Math.floor(capaciteMoulage / specs.moulage_h);
        const maxFinition = Math.floor(capaciteFinition / specs.finition_h);
        const maxProduction = Math.min(maxMoulage, maxFinition);
        
        // Identifier les meilleurs mois (coefficients élevés)
        const moisAvecCoeff = coeffs.map((c, i) => ({ mois: MOIS[i], coeff: c, prixVente: prixVente * c }));
        moisAvecCoeff.sort((a, b) => b.coeff - a.coeff);
        const meilleursMois = moisAvecCoeff.slice(0, 5);
        const piresMois = moisAvecCoeff.slice(-3);
        
        analyses[nomBateau] = {
            specs,
            couts,
            prixVente,
            prixVenteMoyenPondere,
            margeBrute,
            margeBrutePonderee,
            tauxMarge,
            tauxMargePondere,
            tempsTotalProduction,
            rentabiliteParHeure,
            rentabiliteParHeurePonderee,
            maxProduction,
            meilleursMois,
            piresMois
        };
    }
    
    // Afficher l'analyse
    const capaciteMoulage = getCapaciteMoulage();
    const capaciteFinition = getCapaciteFinition();
    const nbMachinesMoulage = getNbMachinesMoulage();
    const nbMachinesFinition = getNbMachinesFinition();
    
    let html = `
        <div style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.08) 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h4 style="margin-top: 0; color: #000;">🏭 Capacités de production actuelles</h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                <div style="background: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 16px;">
                    <div style="font-size: 14px; color: #6e6e73; margin-bottom: 4px;">Moulage</div>
                    <div style="font-size: 24px; font-weight: 600; color: #000;">${nbMachinesMoulage} machines</div>
                    <div style="font-size: 13px; color: #6e6e73; margin-top: 4px;">
                        Capacité totale: ${capaciteMoulage}h/mois<br>
                        Coût total: ${formatNombre(getCoutMachineMoulage())} €/mois
                    </div>
                </div>
                <div style="background: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 16px;">
                    <div style="font-size: 14px; color: #6e6e73; margin-bottom: 4px;">Finition</div>
                    <div style="font-size: 24px; font-weight: 600; color: #000;">${nbMachinesFinition} machines</div>
                    <div style="font-size: 13px; color: #6e6e73; margin-top: 4px;">
                        Capacité totale: ${capaciteFinition}h/mois<br>
                        Coût total: ${formatNombre(getCoutMachineFinition())} €/mois
                    </div>
                </div>
            </div>
        </div>
        
        <h3>📊 Analyse de rentabilité par type de bateau</h3>
        <p style="color: #6e6e73; margin-bottom: 24px;">
            Cette analyse prend en compte les coefficients saisonniers et les capacités des machines pour déterminer la production optimale.
        </p>
    `;
    
    // Classement par rentabilité
    const classement = Object.entries(analyses).sort((a, b) => 
        b[1].rentabiliteParHeurePonderee - a[1].rentabiliteParHeurePonderee
    );
    
    classement.forEach(([nomBateau, analyse], index) => {
        const medaille = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
        const couleur = index === 0 ? "#4CAF50" : index === 1 ? "#FF9800" : "#F44336";
        
        html += `
            <div style="background: rgba(255, 255, 255, 0.7); border-left: 4px solid ${couleur}; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <h4 style="margin-top: 0; color: ${couleur};">${medaille} ${nomBateau} - Rentabilité ${index === 0 ? "MAXIMALE" : index === 1 ? "MOYENNE" : "FAIBLE"}</h4>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-top: 16px;">
                    <div>
                        <strong>💰 Prix de vente:</strong><br>
                        <span style="font-size: 20px; color: #000;">${formatNombre(analyse.prixVente)} €</span><br>
                        <small style="color: #6e6e73;">Moyenne pondérée: ${formatNombre(analyse.prixVenteMoyenPondere)} €</small>
                    </div>
                    
                    <div>
                        <strong>📉 Coût de production:</strong><br>
                        <span style="font-size: 20px; color: #000;">${formatNombre(analyse.couts.total)} €</span>
                    </div>
                    
                    <div>
                        <strong>💵 Marge brute:</strong><br>
                        <span style="font-size: 20px; color: ${analyse.margeBrute > 0 ? '#4CAF50' : '#F44336'};">${formatNombre(analyse.margeBrute)} €</span><br>
                        <small style="color: #6e6e73;">Taux de marge: ${analyse.tauxMarge.toFixed(1)}%</small>
                    </div>
                    
                    <div>
                        <strong>⚡ Rentabilité horaire:</strong><br>
                        <span style="font-size: 20px; color: ${couleur};">${formatNombre(analyse.rentabiliteParHeurePonderee)} €/h</span><br>
                        <small style="color: #6e6e73;">Temps production: ${analyse.tempsTotalProduction}h</small>
                    </div>
                    
                    <div>
                        <strong>🏭 Production max/mois:</strong><br>
                        <span style="font-size: 20px; color: #000;">${analyse.maxProduction} unités</span><br>
                        <small style="color: #6e6e73;">Limité par les machines</small>
                    </div>
                    
                    <div>
                        <strong>📦 Matières nécessaires:</strong><br>
                        <small style="color: #6e6e73;">
                            Bois: ${analyse.specs.bois} m³<br>
                            Plastique: ${analyse.specs.plastique} t
                        </small>
                    </div>
                </div>
                
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.1);">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <strong style="color: #4CAF50;">✅ Meilleurs mois (coefficients élevés):</strong>
                            <ul style="margin: 8px 0; padding-left: 20px; color: #000;">
                                ${analyse.meilleursMois.slice(0, 3).map(m => 
                                    `<li><strong>${m.mois}</strong>: coeff ${m.coeff.toFixed(2)} → prix ${formatNombre(m.prixVente)} €</li>`
                                ).join('')}
                            </ul>
                        </div>
                        <div>
                            <strong style="color: #F44336;">❌ Pires mois (coefficients faibles):</strong>
                            <ul style="margin: 8px 0; padding-left: 20px; color: #000;">
                                ${analyse.piresMois.map(m => 
                                    `<li><strong>${m.mois}</strong>: coeff ${m.coeff.toFixed(2)} → prix ${formatNombre(m.prixVente)} €</li>`
                                ).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Recommandations stratégiques
    html += `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 16px; padding: 24px; margin-top: 24px;">
            <h3 style="margin-top: 0; color: white;">💡 Recommandations stratégiques</h3>
            
            <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-top: 16px;">
                <strong>1️⃣ Production prioritaire:</strong> ${classement[0][0]}<br>
                <small>Raison: Meilleure rentabilité horaire (${formatNombre(classement[0][1].rentabiliteParHeurePonderee)} €/h) et marge de ${classement[0][1].tauxMarge.toFixed(1)}%</small>
            </div>
            
            <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-top: 12px;">
                <strong>2️⃣ Calendrier optimal:</strong><br>
                ${Object.entries(analyses).map(([nom, a]) => 
                    `<small>• ${nom}: Produire en ${a.meilleursMois.slice(0, 3).map(m => m.mois).join(', ')}</small>`
                ).join('<br>')}
            </div>
            
            <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-top: 12px;">
                <strong>3️⃣ Capacité machines:</strong><br>
                <small>
                    • Moulage: ${nbMachinesMoulage} machines × 200h = ${capaciteMoulage}h/mois disponibles<br>
                    • Finition: ${nbMachinesFinition} machines × 200h = ${capaciteFinition}h/mois disponibles<br>
                    • Optimiser le mix de production pour ne pas dépasser ces capacités
                </small>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function calculerMixOptimal() {
    // Calculer le mix optimal de production pour maximiser les bénéfices
    // tout en respectant les contraintes de capacité des machines
    
    const container = document.getElementById("mix-optimal-container");
    if (!container) return;
    
    // Récupérer les stocks
    const stockBois = getStockBois();
    const stockPlastique = getStockPlastique();
    
    // Pour chaque bateau, calculer la rentabilité (sans stock pour la comparaison)
    const rentabilites = [];
    for (const [nomBateau, specs] of Object.entries(BATEAUX)) {
        const couts = coutProduction(nomBateau, 1, false, 0, 0); // Sans stock pour comparaison équitable
        const coeffs = COEFFICIENTS_SAISONNIERS[nomBateau];
        const coeffMoyen = coeffs.reduce((a, b) => a + b, 0) / 12;
        const prixVenteMoyen = specs.prixVente * coeffMoyen;
        const margeBrute = prixVenteMoyen - couts.total;
        const tempsTotalProduction = specs.moulage_h + specs.finition_h;
        const rentabiliteParHeure = margeBrute / tempsTotalProduction;
        
        rentabilites.push({
            nom: nomBateau,
            specs,
            couts,
            rentabiliteParHeure,
            margeBrute
        });
    }
    
    // Trier par rentabilité décroissante
    rentabilites.sort((a, b) => b.rentabiliteParHeure - a.rentabiliteParHeure);
    
    // Calculer un mix optimal simple (algorithme glouton)
    const capaciteMoulage = getCapaciteMoulage();
    const capaciteFinition = getCapaciteFinition();
    let tempsMoulageRestant = capaciteMoulage;
    let tempsFinitionRestant = capaciteFinition;
    const mixOptimal = {};
    
    for (const item of rentabilites) {
        const maxParMoulage = Math.floor(tempsMoulageRestant / item.specs.moulage_h);
        const maxParFinition = Math.floor(tempsFinitionRestant / item.specs.finition_h);
        const quantite = Math.min(maxParMoulage, maxParFinition);
        
        if (quantite > 0) {
            mixOptimal[item.nom] = quantite;
            tempsMoulageRestant -= quantite * item.specs.moulage_h;
            tempsFinitionRestant -= quantite * item.specs.finition_h;
        }
    }
    
    // Calculer les besoins totaux en matières avec prise en compte du stock
    let boisTotal = 0;
    let plastiqueTotal = 0;
    let beneficeTotal = 0;
    let coutTotal = 0;
    let revenusTotal = 0;
    let stockBoisRestant = stockBois;
    let stockPlastiqueRestant = stockPlastique;
    
    for (const [nom, qte] of Object.entries(mixOptimal)) {
        const specs = BATEAUX[nom];
        const couts = coutProduction(nom, qte, true, stockBoisRestant, stockPlastiqueRestant);
        const coeffs = COEFFICIENTS_SAISONNIERS[nom];
        const coeffMoyen = coeffs.reduce((a, b) => a + b, 0) / 12;
        const prixVenteMoyen = specs.prixVente * coeffMoyen;
        
        boisTotal += specs.bois * qte;
        plastiqueTotal += specs.plastique * qte;
        const revenus = prixVenteMoyen * qte;
        const cout = couts.total * qte;
        revenusTotal += revenus;
        coutTotal += cout;
        beneficeTotal += (revenus - cout);
        
        // Mettre à jour le stock restant
        stockBoisRestant = Math.max(0, stockBoisRestant - couts.besoinBois);
        stockPlastiqueRestant = Math.max(0, stockPlastiqueRestant - couts.besoinPlastique);
    }
    
    let html = `
        <h3>🎯 Mix de production optimal (mensuel)</h3>
        <p style="color: #6e6e73; margin-bottom: 20px;">
            Ce mix maximise les bénéfices en tenant compte des capacités machines disponibles.
        </p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
            ${Object.entries(mixOptimal).map(([nom, qte]) => {
                const specs = BATEAUX[nom];
                const coeffs = COEFFICIENTS_SAISONNIERS[nom];
                const coeffMoyen = coeffs.reduce((a, b) => a + b, 0) / 12;
                const prixVenteMoyen = specs.prixVente * coeffMoyen;
                const couts = coutProduction(nom, qte);
                const benefice = (prixVenteMoyen * qte) - (couts.total * qte);
                
                return `
                    <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border-radius: 12px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: 700; color: #667eea;">${qte}</div>
                        <div style="font-size: 14px; font-weight: 600; color: #000; margin-top: 4px;">${nom}</div>
                        <div style="font-size: 12px; color: #6e6e73; margin-top: 8px;">
                            Bénéfice: ${formatNombre(benefice)} €
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        
        <div style="background: rgba(255, 255, 255, 0.7); border-radius: 12px; padding: 20px;">
            <h4 style="margin-top: 0;">📦 Besoins mensuels en matières premières</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                <div style="background: rgba(139, 69, 19, 0.1); border-radius: 8px; padding: 16px;">
                    <div style="font-size: 14px; color: #6e6e73;">Bois</div>
                    <div style="font-size: 24px; font-weight: 600; color: #8B4513;">${formatNombre(boisTotal)} m³</div>
                    <div style="font-size: 12px; color: #6e6e73; margin-top: 4px;">
                        ${stockBois > 0 ? `Stock: ${formatNombre(Math.min(boisTotal, stockBois))} m³<br>` : ''}
                        À acheter: ${formatNombre(Math.max(0, boisTotal - stockBois))} m³<br>
                        Coût: ${formatNombre(Math.max(0, boisTotal - stockBois) * getPrixBois())} €
                    </div>
                </div>
                <div style="background: rgba(76, 175, 80, 0.1); border-radius: 8px; padding: 16px;">
                    <div style="font-size: 14px; color: #6e6e73;">Plastique</div>
                    <div style="font-size: 24px; font-weight: 600; color: #4CAF50;">${formatNombre(plastiqueTotal)} t</div>
                    <div style="font-size: 12px; color: #6e6e73; margin-top: 4px;">
                        ${stockPlastique > 0 ? `Stock: ${formatNombre(Math.min(plastiqueTotal, stockPlastique))} t<br>` : ''}
                        À acheter: ${formatNombre(Math.max(0, plastiqueTotal - stockPlastique))} t<br>
                        Coût: ${formatNombre(Math.max(0, plastiqueTotal - stockPlastique) * getPrixPlastique())} €
                    </div>
                </div>
            </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; border-radius: 12px; padding: 20px; margin-top: 16px;">
            <h4 style="margin-top: 0; color: white;">💰 Résultat financier mensuel (prix moyens pondérés)</h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center;">
                <div>
                    <div style="font-size: 14px; opacity: 0.9;">Revenus</div>
                    <div style="font-size: 28px; font-weight: 700;">${formatNombre(revenusTotal)} €</div>
                </div>
                <div>
                    <div style="font-size: 14px; opacity: 0.9;">Coûts</div>
                    <div style="font-size: 28px; font-weight: 700;">${formatNombre(coutTotal)} €</div>
                </div>
                <div>
                    <div style="font-size: 14px; opacity: 0.9;">Bénéfice</div>
                    <div style="font-size: 32px; font-weight: 700;">${formatNombre(beneficeTotal)} €</div>
                </div>
            </div>
        </div>
        
        <div style="background: rgba(255, 152, 0, 0.1); border: 2px solid #FF9800; border-radius: 12px; padding: 16px; margin-top: 16px;">
            <strong style="color: #FF9800;">⚠️ Note importante:</strong>
            <p style="margin: 8px 0 0 0; color: #000; font-size: 14px;">
                Ce mix optimal utilise <strong>${formatNombre(capaciteMoulage - tempsMoulageRestant)}h/${capaciteMoulage}h</strong> de moulage 
                (<strong>${((capaciteMoulage - tempsMoulageRestant) / capaciteMoulage * 100).toFixed(1)}%</strong>) 
                et <strong>${formatNombre(capaciteFinition - tempsFinitionRestant)}h/${capaciteFinition}h</strong> de finition 
                (<strong>${((capaciteFinition - tempsFinitionRestant) / capaciteFinition * 100).toFixed(1)}%</strong>).<br>
                Ajustez les quantités selon les coefficients saisonniers pour maximiser les profits sur l'année.
            </p>
        </div>
    `;
    
    container.innerHTML = html;
}

function calculerStrategieAnnuelle() {
    const container = document.getElementById("strategie-annuelle-container");
    if (!container) return;
    
    // Pour chaque bateau et chaque mois, calculer la rentabilité
    const strategieParMois = [];
    
    for (let mois = 0; mois < 12; mois++) {
        const moisData = {
            nom: MOIS[mois],
            index: mois,
            bateaux: []
        };
        
        for (const [nomBateau, specs] of Object.entries(BATEAUX)) {
            const coeff = COEFFICIENTS_SAISONNIERS[nomBateau][mois];
            const prixVente = specs.prixVente * coeff;
            const couts = coutProduction(nomBateau, 1);
            const marge = prixVente - couts.total;
            const tempsTotal = specs.moulage_h + specs.finition_h;
            const rentabilite = marge / tempsTotal;
            
            moisData.bateaux.push({
                nom: nomBateau,
                coeff,
                prixVente,
                marge,
                rentabilite,
                recommande: coeff >= 1.2 // Seuil de recommandation
            });
        }
        
        // Trier par rentabilité
        moisData.bateaux.sort((a, b) => b.rentabilite - a.rentabilite);
        strategieParMois.push(moisData);
    }
    
    let html = `
        <h3>📅 Stratégie de production annuelle</h3>
        <p style="color: #6e6e73; margin-bottom: 20px;">
            Recommandations mois par mois en fonction des coefficients saisonniers (prix × coefficient).
        </p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
    `;
    
    for (const moisData of strategieParMois) {
        const meilleur = moisData.bateaux[0];
        const bateauxRecommandes = moisData.bateaux.filter(b => b.recommande);
        
        // Déterminer la couleur selon la période
        let couleurFond = "rgba(244, 67, 54, 0.1)"; // Rouge pour faible saison
        let couleurBordure = "#F44336";
        let icone = "❄️";
        
        if (bateauxRecommandes.length >= 2) {
            couleurFond = "rgba(76, 175, 80, 0.1)"; // Vert pour haute saison
            couleurBordure = "#4CAF50";
            icone = "☀️";
        } else if (bateauxRecommandes.length === 1) {
            couleurFond = "rgba(255, 152, 0, 0.1)"; // Orange pour moyenne saison
            couleurBordure = "#FF9800";
            icone = "🌤️";
        }
        
        html += `
            <div style="background: ${couleurFond}; border: 2px solid ${couleurBordure}; border-radius: 12px; padding: 16px;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <span style="font-size: 24px; margin-right: 8px;">${icone}</span>
                    <strong style="font-size: 16px; color: #000;">${moisData.nom}</strong>
                </div>
                
                ${bateauxRecommandes.length > 0 ? `
                    <div style="background: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                        <div style="font-size: 13px; color: #6e6e73; margin-bottom: 8px;">
                            <strong>🎯 À produire en priorité:</strong>
                        </div>
                        ${bateauxRecommandes.map(b => `
                            <div style="margin: 4px 0; font-size: 12px;">
                                <strong style="color: ${couleurBordure};">${b.nom}</strong><br>
                                <small style="color: #6e6e73;">
                                    Coeff: ${b.coeff.toFixed(2)} | 
                                    Prix: ${formatNombre(b.prixVente)} € | 
                                    Marge: ${formatNombre(b.marge)} €
                                </small>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="background: rgba(255, 255, 255, 0.7); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                        <div style="font-size: 12px; color: #6e6e73;">
                            ⚠️ <strong>Basse saison</strong> - Réduire la production ou se concentrer sur:<br>
                            <strong style="color: #000;">${meilleur.nom}</strong>
                            <small>(meilleure option: ${formatNombre(meilleur.marge)} € de marge)</small>
                        </div>
                    </div>
                `}
                
                <div style="font-size: 11px; color: #6e6e73; margin-top: 8px;">
                    <strong>Rentabilité horaire:</strong><br>
                    ${moisData.bateaux.map((b, i) => 
                        `${i + 1}. ${b.nom}: ${formatNombre(b.rentabilite)} €/h`
                    ).join('<br>')}
                </div>
            </div>
        `;
    }
    
    html += `
        </div>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 16px; padding: 24px; margin-top: 24px;">
            <h4 style="margin-top: 0; color: white;">💡 Synthèse de la stratégie annuelle</h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
    `;
    
    // Compter les saisons par bateau
    for (const [nomBateau] of Object.entries(BATEAUX)) {
        const coeffs = COEFFICIENTS_SAISONNIERS[nomBateau];
        const moisHauteSaison = coeffs.filter(c => c >= 1.2).length;
        const moisMoyenneSaison = coeffs.filter(c => c >= 0.8 && c < 1.2).length;
        const moisBasseSaison = coeffs.filter(c => c < 0.8).length;
        
        html += `
            <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 16px;">
                <strong style="font-size: 16px;">${nomBateau}</strong>
                <div style="margin-top: 12px; font-size: 13px;">
                    <div style="margin: 4px 0;">☀️ Haute saison: ${moisHauteSaison} mois</div>
                    <div style="margin: 4px 0;">🌤️ Moyenne saison: ${moisMoyenneSaison} mois</div>
                    <div style="margin: 4px 0;">❄️ Basse saison: ${moisBasseSaison} mois</div>
                </div>
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
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
    analyserRentabilite();
    calculerMixOptimal();
    calculerStrategieAnnuelle();
};


