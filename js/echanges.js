/* ==========================================================================
   echanges.js - PAGE ECHANGES
   Affiche la liste des échanges, avec recherche et photo de l'ancien produit.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const recherche = document.getElementById("exchangesSearch");
  const tableau = document.getElementById("exchangesTable");

  function afficher() {
    const texte = normaliserRecherche(recherche.value);

    const echanges = db.echanges.filter(e =>
      normaliserRecherche(e.reference + " " + e.client + " " + e.nouveauProduit + " " + e.ancienNom).includes(texte));

    tableau.innerHTML = echanges.map(e => `
      <tr>
        <td data-label="Référence">${echapper(e.reference)}</td>
        <td data-label="Client">${echapper(e.client)}</td>
        <td data-label="Nouveau produit">${echapper(e.nouveauProduit)}</td>
        <td data-label="Ancien produit">${echapper(e.ancienNom)}<br><small>${echapper(e.etat)}</small></td>
        <td data-label="Photo">
          <button class="btn btn-neutral btn-small" data-photo="${e.id}">Voir la photo</button>
        </td>
        <td data-label="Reprise">${monnaie(e.reprise)}</td>
        <td data-label="Complément">${monnaie(e.difference)}</td>
        <td data-label="Reste dû">${monnaie(Math.max(0, e.difference - e.verse))}</td>
      </tr>`).join("")
      || '<tr><td colspan="8" class="empty">Aucun échange enregistré.</td></tr>';
  }

  // Clic sur "Voir la photo" (la fonction est dans commun.js)
  tableau.addEventListener("click", evenement => {
    const bouton = evenement.target.closest("[data-photo]");
    if (bouton) afficherPhotoEchange(bouton.dataset.photo);
  });

  recherche.addEventListener("input", afficher);
  afficher();
});
