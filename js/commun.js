/* ==========================================================================
   commun.js - CODE COMMUN A TOUTES LES PAGES

   Il s'occupe de :
     - mettre en couleur le lien de la page actuelle dans le menu
     - le bouton hamburger du menu (téléphone)
     - le titre de la page et les chiffres clés de l'accueil
     - la photo en grand, l'export et la réinitialisation des données
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  // Nom du fichier de la page actuelle, par exemple "stock.html"
  const pageActuelle = location.pathname.split("/").pop() || "index.html";

  // --- Menu : le lien de la page actuelle devient orange ---
  document.querySelectorAll(".menu a").forEach(lien => {
    if (lien.getAttribute("href") === pageActuelle) {
      lien.classList.add("active");
    }
  });

  // --- Bouton hamburger (téléphone) : ouvre et ferme le menu ---
  const boutonMenu = document.getElementById("menuToggle");
  const menu = document.getElementById("menu");
  if (boutonMenu && menu) {
    boutonMenu.addEventListener("click", () => {
      const ouvert = menu.classList.toggle("open");
      boutonMenu.setAttribute("aria-expanded", ouvert);
    });
  }

  // --- Titre de la page ---
  const titres = {
    "index.html":      "Accueil",
    "stock.html":      "Produits et stock",
    "achat.html":      "Nouvelle vente",
    "commandes.html":  "Commandes clients",
    "echange.html":    "Nouvel échange",
    "ventes.html":     "Ventes",
    "echanges.html":   "Échanges",
    "dettes.html":     "Dettes clients",
    "historique.html": "Historique"
  };
  const titre = document.getElementById("pageTitle");
  if (titre) titre.textContent = titres[pageActuelle] || "FALOUAPPLE";

  // --- Chiffres clés (uniquement sur la page d'accueil) ---
  const stats = document.getElementById("globalStats");
  if (stats) {
    const totalUnites = db.produits.reduce((somme, p) => somme + p.stock, 0);
    const totalDettes = db.dettes.reduce((somme, d) => somme + soldeDette(d), 0);

    stats.innerHTML = `
      <div class="stat"><div class="stat-icon">📦</div><div><span>Produits enregistrés</span><strong>${db.produits.length}</strong></div></div>
      <div class="stat"><div class="stat-icon">🏷️</div><div><span>Unités en stock</span><strong>${totalUnites}</strong></div></div>
      <div class="stat"><div class="stat-icon">🧾</div><div><span>Ventes enregistrées</span><strong>${db.ventes.length}</strong></div></div>
      <div class="stat"><div class="stat-icon">💳</div><div><span>Dettes restantes</span><strong>${monnaie(totalDettes)}</strong></div></div>`;
  }

  // --- Tableau de bord avancé V5 ---
  const advanced = document.getElementById("advancedStats");
  if (advanced) {
    const aujourdHui = new Date();
    const ventesMois = db.ventes.filter(v => { const d = dateOperation(v.date); return d && d.getMonth() === aujourdHui.getMonth() && d.getFullYear() === aujourdHui.getFullYear(); });
    const ca = ventesMois.reduce((s,v)=>s+(Number(v.total)||0),0);
    const encaisse = ventesMois.reduce((s,v)=>s+(Number(v.verse)||0),0);
    const marge = ventesMois.reduce((s,v)=>s+(Number(v.prix||0)-Number(v.coutUnitaire||0))*(Number(v.quantite)||0),0);
    const valeurStock = db.produits.reduce((s,p)=>s+(Number(p.cout||0)*Number(p.stock||0)),0);
    const cartes = [["Chiffre d'affaires du mois",monnaie(ca)],["Encaissements du mois",monnaie(encaisse)],["Marge estimée",monnaie(marge)],["Valeur du stock au coût",monnaie(valeurStock)]];
    advanced.innerHTML = cartes.map(([l,v])=>`<div class="kpi"><span>${l}</span><strong>${v}</strong><small>Mois en cours / données disponibles</small></div>`).join("");
  }
  const chart = document.getElementById("salesChart");
  if (chart) {
    const jours = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d;});
    const valeurs = jours.map(d=>db.ventes.filter(v=>{const x=dateOperation(v.date);return x&&x.toDateString()===d.toDateString();}).reduce((s,v)=>s+(Number(v.total)||0),0));
    const max = Math.max(1,...valeurs);
    chart.innerHTML = jours.map((d,i)=>`<div class="chart-col"><span class="chart-bar" style="height:${Math.max(3,valeurs[i]/max*145)}px" title="${monnaie(valeurs[i])}"></span>${d.toLocaleDateString("fr-FR",{weekday:"short"})}</div>`).join("");
  }

  // --- Avertissement si le navigateur ne garde pas les données entre les pages ---
  if (modeSecours) {
    const bandeau = document.createElement("div");
    bandeau.className = "storage-warning";
    bandeau.innerHTML = "⚠️ <strong>Votre navigateur ne conserve pas les données de façon durable.</strong> " +
      "Elles sont gardées seulement tant que cet onglet reste ouvert. Pour un enregistrement permanent, " +
      "ouvrez le site avec l'extension « Live Server » de VS Code (ou un autre petit serveur local).";
    document.querySelector(".page").prepend(bandeau);
  }
});


/* --------------------------------------------------------------------------
   PHOTO D'UN ANCIEN PRODUIT (page Échanges)
   Affiche la photo en grand dans une fenêtre, sans ouvrir de nouvel onglet.
   -------------------------------------------------------------------------- */
function afficherPhotoEchange(id) {
  const echange = db.echanges.find(e => e.id === Number(id));
  if (!echange || !echange.photo) {
    notifier("Photo introuvable.");
    return;
  }

  const fenetre = document.createElement("dialog");
  fenetre.className = "lightbox";
  fenetre.innerHTML = `
    <h3>${echapper(echange.ancienNom)}</h3>
    <p class="help">Client : ${echapper(echange.client)}</p>
    <img src="${echange.photo}" alt="Photo du produit repris">
    <div class="actions" style="margin-top:1rem">
      <button type="button" class="btn btn-neutral">Fermer</button>
    </div>`;
  document.body.appendChild(fenetre);
  fenetre.showModal();

  fenetre.querySelector("button").addEventListener("click", () => fenetre.close());
  fenetre.addEventListener("close", () => fenetre.remove());
}


/* --------------------------------------------------------------------------
   SAUVEGARDE ET REINITIALISATION (page Historique)
   -------------------------------------------------------------------------- */

// Télécharge toutes les données dans un fichier .json (sauvegarde).
function exporterDonnees() {
  const contenu = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
  const adresse = URL.createObjectURL(contenu);

  const lien = document.createElement("a");
  lien.href = adresse;
  lien.download = "ideal-sauvegarde.json";
  lien.click();

  setTimeout(() => URL.revokeObjectURL(adresse), 1000);
}

// Efface toutes les opérations enregistrées dans ce navigateur.
function reinitialiserDonnees() {
  if (!confirm("Cette action supprimera les opérations enregistrées sur ce navigateur. Continuer ?")) return;
  try { localStorage.removeItem(STORAGE_KEY); } catch (erreur) { /* rien */ }
  window.name = "";   // efface aussi la copie de secours
  location.href = "index.html";
}


/* Facture / reçu imprimable — V7 */
function imprimerFacture(id) {
  const v = db.ventes.find(x => x.id === Number(id));
  if (!v) return notifier("Vente introuvable.");
  const f = window.open("", "_blank", "width=850,height=900");
  if (!f) return notifier("Autorisez les fenêtres pop-up pour imprimer la facture.");
  const reste = Math.max(0, Number(v.total)-Number(v.verse));
  f.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Facture ${echapper(v.reference)}</title><style>body{font:15px Arial,sans-serif;color:#222;margin:40px}.head{display:flex;justify-content:space-between;border-bottom:3px solid #ef642d;padding-bottom:20px}.muted{color:#666}.box{border:1px solid #ddd;padding:18px;margin:22px 0;border-radius:8px}table{width:100%;border-collapse:collapse;margin-top:25px}th,td{text-align:left;padding:12px;border-bottom:1px solid #ddd}.total{text-align:right;font-size:18px;margin-top:25px}.thanks{text-align:center;margin-top:60px;color:#666}@media print{button{display:none}}</style></head><body><div class="head"><div><h1>IDEAL</h1><p class="muted">Facture / reçu de vente</p></div><div><b>${echapper(v.reference)}</b><p>${echapper(v.date)}</p></div></div><div class="box"><b>Client :</b> ${echapper(v.client)}<br><b>Téléphone :</b> ${echapper(v.telephone||"—")}<br><b>Mode de paiement :</b> ${echapper(v.mode||"—")}</div><table><thead><tr><th>Article</th><th>Quantité</th><th>Prix unitaire</th><th>Total</th></tr></thead><tbody><tr><td>${echapper(v.produit)}</td><td>${v.quantite}</td><td>${monnaie(v.prix)}</td><td>${monnaie(v.total)}</td></tr></tbody></table><div class="total"><p>Total : <b>${monnaie(v.total)}</b></p><p>Payé : <b>${monnaie(v.verse)}</b></p><p>Reste dû : <b>${monnaie(reste)}</b></p></div><p class="thanks">Merci pour votre confiance.</p><script>window.onload=()=>window.print()<\/script></body></html>`);
  f.document.close();
}

function dateOperation(valeur) {
  const s=String(valeur||"");
  const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s*,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if(m) return new Date(Number(m[3]),Number(m[2])-1,Number(m[1]),Number(m[4]||0),Number(m[5]||0),Number(m[6]||0));
  const d=new Date(s); return Number.isNaN(d.getTime())?null:d;
}
