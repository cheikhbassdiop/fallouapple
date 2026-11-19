/* Authentification serveur FalouApple : les mots de passe ne sont jamais stockés dans le navigateur. */
const API_AUTH = "backend/auth.php";
let utilisateurConnecte = null;
let verificationSessionFaite = false;

function requeteAuth(action, method = "GET", donnees = null) {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open(method, API_AUTH + "?action=" + encodeURIComponent(action), false);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Accept", "application/json");
    if (donnees) xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(donnees ? JSON.stringify(donnees) : null);
    let data = {}; try { data = JSON.parse(xhr.responseText || "{}"); } catch (_) {}
    return { ok: xhr.status >= 200 && xhr.status < 300, data };
  } catch (_) { return { ok: false, data: { error: "Serveur inaccessible. Vérifiez votre installation PHP/MySQL." } }; }
}

function obtenirUtilisateur() {
  if (!verificationSessionFaite) {
    const r = requeteAuth("me");
    utilisateurConnecte = r.ok ? r.data.user : null;
    verificationSessionFaite = true;
  }
  return utilisateurConnecte;
}

function estAdmin() {
  const u = obtenirUtilisateur();
  return !!u && ["admin", "manager"].includes(u.role);
}

function deconnecterAdmin() {
  requeteAuth("logout", "POST", {});
  utilisateurConnecte = null;
  verificationSessionFaite = true;
  location.href = "index.html";
}

function ouvrirConnexionAdmin() {
  const fenetre = document.createElement("dialog");
  fenetre.className = "login-dialog";
  fenetre.innerHTML = `
    <form id="formulaireAdmin" method="dialog">
      <h3>Connexion à FalouApple</h3>
      <p class="help">Connectez-vous avec votre compte administrateur ou gestionnaire.</p>
      <div class="field"><label for="adminEmail">Adresse e-mail</label><input id="adminEmail" type="email" autocomplete="username" required></div>
      <div class="field"><label for="adminPassword">Mot de passe</label><input id="adminPassword" type="password" autocomplete="current-password" required></div>
      <p class="error" id="erreurAdmin" role="alert"></p>
      <div class="actions"><button type="button" class="btn btn-neutral" id="annulerAdmin">Annuler</button><button type="submit" class="btn btn-primary">Se connecter</button></div>
    </form>`;
  document.body.appendChild(fenetre); fenetre.showModal();
  fenetre.querySelector("#annulerAdmin").addEventListener("click", () => fenetre.close());
  fenetre.addEventListener("close", () => fenetre.remove());
  fenetre.querySelector("#formulaireAdmin").addEventListener("submit", e => {
    e.preventDefault();
    const email = fenetre.querySelector("#adminEmail").value.trim();
    const password = fenetre.querySelector("#adminPassword").value;
    const r = requeteAuth("login", "POST", { email, password });
    if (!r.ok) { fenetre.querySelector("#erreurAdmin").textContent = r.data.error || "Connexion impossible."; return; }
    fenetre.close(); location.reload();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const user = obtenirUtilisateur();
  const admin = !!user && ["admin", "manager"].includes(user.role);
  document.body.classList.toggle("is-admin", admin);
  document.querySelectorAll("[data-admin]").forEach(el => { el.hidden = !admin; });
  document.querySelectorAll("[data-public]").forEach(el => { el.hidden = admin; });
  const bouton = document.getElementById("adminBtn");
  if (bouton) {
    bouton.textContent = user ? "Déconnexion" : "Connexion";
    bouton.addEventListener("click", () => user ? deconnecterAdmin() : ouvrirConnexionAdmin());
  }
  document.querySelectorAll("[data-login-admin]").forEach(el => el.addEventListener("click", ouvrirConnexionAdmin));
  if (!user) {
    const page = document.querySelector(".page");
    if (page) {
      const banner = document.createElement("div"); banner.className = "storage-warning";
      banner.textContent = "Mode consultation : connectez-vous pour charger et synchroniser les données MySQL.";
      page.prepend(banner);
    }
  }
});
