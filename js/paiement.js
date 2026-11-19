document.addEventListener("DOMContentLoaded", () => {
  const bouton = document.getElementById("copyPaymentNumber");
  const methode = document.getElementById("purchaseMethod");
  const info = document.getElementById("onlinePaymentInfo");
  if (bouton) bouton.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText("780128084"); notifier("Numéro 780128084 copié."); }
    catch (_) { notifier("Numéro de paiement : 780128084"); }
  });
  function afficher() { if (info && methode) info.hidden = !["Wave", "Orange Money"].includes(methode.value); }
  if (methode) { methode.addEventListener("change", afficher); afficher(); }
});
