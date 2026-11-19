/* ==========================================================================
   dettes.js - PAGE DETTES CLIENTS
   Affiche les dettes et permet d'enregistrer un remboursement.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const tableau = document.getElementById("debtsTable");
  const choixDette = document.getElementById("debtSelect");
  const formulaire = document.getElementById("repaymentForm");

  // Affiche la liste des dettes et la liste déroulante des dettes en cours
  function afficher() {
    tableau.innerHTML = db.dettes.map(d => `
      <tr>
        <td data-label="Client">${echapper(d.client)}</td>
        <td data-label="Origine">${echapper(d.origine)}</td>
        <td data-label="Montant initial">${monnaie(d.montant)}</td>
        <td data-label="Montant payé">${monnaie(d.paye)}</td>
        <td data-label="Reste à payer">${monnaie(soldeDette(d))}</td>
      </tr>`).join("")
      || '<tr><td colspan="5" class="empty">Aucune dette enregistrée.</td></tr>';

    // Seules les dettes non soldées peuvent être remboursées
    const enCours = db.dettes.filter(d => soldeDette(d) > 0);
    choixDette.innerHTML = enCours.map(d =>
      `<option value="${d.id}">${echapper(d.client)} — ${echapper(d.origine)} — reste ${monnaie(soldeDette(d))}</option>`
    ).join("") || '<option value="">Aucune dette en cours</option>';
  }

  // Enregistrement d'un remboursement
  formulaire.addEventListener("submit", evenement => {
    evenement.preventDefault();

    const dette = db.dettes.find(d => d.id === Number(choixDette.value));
    const montant = Number(document.getElementById("repaymentAmount").value);

    if (!dette) {
      notifier("Aucune dette sélectionnée.");
      return;
    }
    if (montant <= 0 || montant > soldeDette(dette)) {
      notifier("Montant invalide ou supérieur au solde restant.");
      return;
    }

    dette.paye += montant;
    ajouterHistorique("Remboursement", "Remboursement de " + dette.origine, dette.client, montant);

    if (!sauvegarder()) return;
    formulaire.reset();
    afficher();
    notifier("Remboursement enregistré.");
  });

  afficher();
});
