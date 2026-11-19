/* ==========================================================================
   ventes.js - PAGE VENTES
   Affiche la liste des ventes, avec une barre de recherche.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const recherche = document.getElementById("salesSearch");
  const tableau = document.getElementById("salesTable");

  function afficher() {
    const texte = normaliserRecherche(recherche.value);

    // On garde les ventes dont la référence, le client ou le produit contient le texte cherché
    const ventes = db.ventes.filter(v =>
      normaliserRecherche(v.reference + " " + v.client + " " + v.produit).includes(texte));

    tableau.innerHTML = ventes.map(v => `
      <tr>
        <td data-label="Référence">${echapper(v.reference)}</td>
        <td data-label="Client">${echapper(v.client)}</td>
        <td data-label="Produit">${echapper(v.produit)} × ${v.quantite}</td>
        <td data-label="Total">${monnaie(v.total)}</td>
        <td data-label="Payé">${monnaie(v.verse)}</td>
        <td data-label="Reste">${monnaie(v.total - v.verse)}</td>
        <td data-label="Paiement">${echapper(v.mode||"—")}</td>
        <td data-label="Date">${echapper(v.date)}</td><td><button class="btn btn-neutral btn-small" data-invoice="${v.id}">Imprimer</button></td>
      </tr>`).join("")
      || '<tr><td colspan="9" class="empty">Aucune vente enregistrée.</td></tr>';
  }

  tableau.addEventListener("click", e => { const b=e.target.closest("[data-invoice]"); if(b) imprimerFacture(b.dataset.invoice); });
  recherche.addEventListener("input", afficher);
  afficher();
});
