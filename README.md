# Calcul des coûts — M1 MTS

Application web statique réalisée dans le cadre d'un travail de **M1 MTS** pour explorer des scénarios de production, leurs coûts et leur rentabilité.

L'outil fonctionne directement dans le navigateur en HTML/CSS/JavaScript et produit des calculs ainsi qu'une visualisation via Chart.js.

## Ce que calcule l'outil

À partir des paramètres de machines, matières, stocks et volumes mensuels, l'application permet notamment d'estimer :

- les coûts directs et indirects ;
- les capacités de production ;
- le nombre de machines nécessaire ;
- les contraintes liées aux matières disponibles ;
- un mix de production ;
- une stratégie annuelle ;
- la rentabilité et des recommandations associées.

Les références de produits actuellement intégrées comprennent notamment `Pech 4`, `Prom 5.5` et `Stan 8`.

## Structure

```text
.
├── index.html    # page d'entrée
├── outil.html    # calculateur principal
├── calculs.js    # logique de calcul
├── data.txt      # données complémentaires
└── style.css     # styles
```

## Lancer le projet

Aucune compilation n'est nécessaire.

Vous pouvez ouvrir `index.html` directement dans un navigateur ou lancer un petit serveur local :

```bash
python -m http.server 8000
```

Puis ouvrez :

```text
http://localhost:8000
```

## Dépendance externe

Le graphique est chargé via le CDN de **Chart.js**. Une connexion réseau peut donc être nécessaire pour afficher la visualisation si la bibliothèque n'est pas mise en cache.

## Contexte

Ce dépôt est un outil pédagogique de calcul/simulation. Les résultats dépendent entièrement des hypothèses et données saisies ; ils ne doivent pas être interprétés comme une recommandation financière ou industrielle réelle sans validation des données.
