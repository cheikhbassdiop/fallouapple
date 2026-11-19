/* ==========================================================================
   historique.js - PAGE HISTORIQUE
   Affiche le journal de toutes les opérations (ventes, échanges, stock...).
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const tableau = document.getElementById("historyTable");

  tableau.innerHTML = db.historique.map(h => `
    <tr>
      <td data-label="Type">${echapper(h.type)}</td>
      <td data-label="Détail">${echapper(h.detail)}</td>
      <td data-label="Client">${echapper(h.client)}</td>
      <td data-label="Montant">${monnaie(h.montant)}</td>
      <td data-label="Date">${echapper(h.date)}</td>
    </tr>`).join("")
    || '<tr><td colspan="5" class="empty">Aucune opération enregistrée.</td></tr>';
});
