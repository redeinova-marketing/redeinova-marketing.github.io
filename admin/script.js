const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwVq2pVKs6J9q-6dtbRO17UWDYyOZRrX477tjtUk8g-4-OGoV8HhQYDxbjTdA1NutmI/exec";

let usuarioLogado = null;
let senhaLogada = "";
let lojaAtual = null;

function $(id) {
  return document.getElementById(id);
}

function mostrarMsg(id, texto, tipo) {
  const el = $(id);
  if (!el) return;

  el.textContent = texto || "";
  el.className = "msg " + (tipo === "ok" ? "ok" : "err");
}

async function chamarAPI(params) {
  const url = new URL(APP_SCRIPT_URL);

  Object.keys(params).forEach(chave => {
    url.searchParams.append(chave, params[chave]);
  });

  const resposta = await fetch(url.toString(), { method: "GET" });

  if (!resposta.ok) {
    throw new Error("Erro HTTP " + resposta.status);
  }

  return resposta.json();
}

function salvarSessao(email, senha, usuario) {
  sessionStorage.setItem("adminEmail", email);
  sessionStorage.setItem("adminSenha", senha);
  sessionStorage.setItem("adminUsuario", JSON.stringify(usuario));
}

function carregarSessao() {
  const email = sessionStorage.getItem("adminEmail");
  const senha = sessionStorage.getItem("adminSenha");
  const usuario = sessionStorage.getItem("adminUsuario");

  if (!email || !senha || !usuario) return false;

  usuarioLogado = JSON.parse(usuario);
  senhaLogada = senha;
  return true;
}

function atualizarSessaoUsuario(usuario) {
  usuarioLogado = usuario;
  sessionStorage.setItem("adminUsuario", JSON.stringify(usuarioLogado));
}

function limparSessao() {
  sessionStorage.removeItem("adminEmail");
  sessionStorage.removeItem("adminSenha");
  sessionStorage.removeItem("adminUsuario");

  usuarioLogado = null;
  senhaLogada = "";
  lojaAtual = null;
}

function atualizarUsuarioNaTela() {
  $("userName").textContent = usuarioLogado.nome || "Usuário";
  $("userEmail").textContent = usuarioLogado.email || "";

  $("userAvatarFallback").textContent =
    (usuarioLogado.nome || "U").charAt(0).toUpperCase();
}

function abrirApp() {
  $("loginPage").classList.add("hidden");
  $("appPage").classList.remove("hidden");
  atualizarUsuarioNaTela();
  abrirLojas();
}

function abrirLogin() {
  $("loginPage").classList.remove("hidden");
  $("appPage").classList.add("hidden");
}

function ativarBotaoMenu(botaoAtivo) {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  botaoAtivo.classList.add("active");
}

function abrirLojas() {
  $("lojasSection").classList.remove("hidden");
  $("perfilSection").classList.add("hidden");
  ativarBotaoMenu($("btnLojas"));
}

function abrirPerfil() {
  $("lojasSection").classList.add("hidden");
  $("perfilSection").classList.remove("hidden");
  ativarBotaoMenu($("btnMeuPerfil"));

  $("perfilNome").value = usuarioLogado.nome || "";
  $("perfilEmail").value = usuarioLogado.email || "";
  $("perfilSenha").value = "";
  $("perfilSenha").type = "password";

  mostrarMsg("perfilMsg", "", "ok");
}

async function login() {
  const email = $("loginEmail").value.trim();
  const senha = $("loginSenha").value.trim();

  if (!email || !senha) {
    return mostrarMsg("loginMsg", "Informe e-mail e senha.", "err");
  }

  $("btnLogin").disabled = true;
  $("btnLogin").textContent = "Entrando...";
  mostrarMsg("loginMsg", "Validando acesso...", "ok");

  try {
    const data = await chamarAPI({
      action: "loginAdmin",
      email: email,
      senha: senha
    });

    if (!data.sucesso) {
      return mostrarMsg("loginMsg", data.mensagem || "E-mail ou senha inválidos.", "err");
    }

    usuarioLogado = data.usuario;
    senhaLogada = senha;

    salvarSessao(email, senha, usuarioLogado);
    abrirApp();
    mostrarMsg("loginMsg", "", "ok");

  } catch (erro) {
    mostrarMsg("loginMsg", "Erro ao fazer login. Tente novamente.", "err");
  } finally {
    $("btnLogin").disabled = false;
    $("btnLogin").textContent = "Entrar";
  }
}

async function buscarLoja() {
  const codigo = $("codigoLoja").value.trim();

  if (!codigo) {
    return mostrarMsg("buscaMsg", "Informe o código da loja.", "err");
  }

  $("btnBuscar").disabled = true;
  $("btnBuscar").textContent = "Buscando...";
  mostrarMsg("buscaMsg", "Buscando loja...", "ok");
  esconderResultado();

  try {
    const data = await chamarAPI({
      action: "buscarLojaAdmin",
      busca: codigo
    });

    if (!data.sucesso || !data.loja) {
      return mostrarMsg("buscaMsg", data.mensagem || "Loja não encontrada.", "err");
    }

    lojaAtual = data.loja;
    preencherLoja(lojaAtual);
    mostrarMsg("buscaMsg", "", "ok");

  } catch (erro) {
    mostrarMsg("buscaMsg", "Erro ao buscar loja. Tente novamente.", "err");
  } finally {
    $("btnBuscar").disabled = false;
    $("btnBuscar").textContent = "Pesquisar";
  }
}

function preencherLoja(loja) {
  $("resultadoCard").classList.remove("hidden");

  $("detCodigo").textContent = loja.codigo || "-";
  $("detCnpj").textContent = loja.cnpj || "-";
  $("detNomeFantasia").textContent = loja.nomeFantasia || "-";
  $("detRazaoSocial").textContent = loja.razaoSocial || "-";
  $("detTelefone").textContent = loja.telefone || "-";
  $("detEmail").textContent = loja.email || "-";
  $("detContato").textContent = loja.contato || "-";
  $("detStatus").textContent = loja.status || "-";
  $("detRelacionadas").textContent = loja.lojasRelacionadas || "-";

  $("linkDrive").value = loja.link || "";

  if (loja.materialDisponivel) {
    $("statusMaterial").textContent = "🟢 Material cadastrado";
    $("statusMaterial").className = "status-pill ok";
    $("btnAbrirLink").disabled = false;
  } else {
    $("statusMaterial").textContent = "🟡 Nenhum material cadastrado";
    $("statusMaterial").className = "status-pill warn";
    $("btnAbrirLink").disabled = true;
  }
}

function esconderResultado() {
  $("resultadoCard").classList.add("hidden");
  lojaAtual = null;
  $("linkMsg").textContent = "";
}

async function salvarLink() {
  if (!lojaAtual) {
    return mostrarMsg("linkMsg", "Pesquise uma loja antes de salvar.", "err");
  }

  const link = $("linkDrive").value.trim();

  if (!link) {
    return mostrarMsg("linkMsg", "Informe o link do Drive.", "err");
  }

  $("btnSalvarLink").disabled = true;
  $("btnSalvarLink").textContent = "Salvando...";
  mostrarMsg("linkMsg", "Salvando link...", "ok");

  try {
    const data = await chamarAPI({
      action: "salvarLinkAdmin",
      email: usuarioLogado.email,
      senha: senhaLogada,
      codigo: lojaAtual.codigo,
      link: link
    });

    if (!data.sucesso) {
      return mostrarMsg("linkMsg", data.mensagem || "Não foi possível salvar o link.", "err");
    }

    lojaAtual.link = link;
    lojaAtual.materialDisponivel = true;
    preencherLoja(lojaAtual);

    mostrarMsg("linkMsg", "Link atualizado com sucesso.", "ok");

  } catch (erro) {
    mostrarMsg("linkMsg", "Erro ao salvar link. Tente novamente.", "err");
  } finally {
    $("btnSalvarLink").disabled = false;
    $("btnSalvarLink").textContent = "Salvar link";
  }
}

async function salvarPerfil() {
  const novaSenha = $("perfilSenha").value.trim();

  $("btnSalvarPerfil").disabled = true;
  $("btnSalvarPerfil").textContent = "Salvando...";
  mostrarMsg("perfilMsg", "Salvando perfil...", "ok");

  try {
    const data = await chamarAPI({
      action: "atualizarPerfilAdmin",
      email: usuarioLogado.email,
      senha: senhaLogada,
      novaSenha: novaSenha,
      foto: usuarioLogado.foto || ""
    });

    if (!data.sucesso) {
      return mostrarMsg("perfilMsg", data.mensagem || "Não foi possível atualizar o perfil.", "err");
    }

    if (novaSenha) {
      senhaLogada = novaSenha;
      sessionStorage.setItem("adminSenha", novaSenha);
    }

    atualizarSessaoUsuario(data.usuario);
    atualizarUsuarioNaTela();

    $("perfilSenha").value = "";
    $("perfilSenha").type = "password";

    mostrarMsg("perfilMsg", "Perfil atualizado com sucesso.", "ok");

  } catch (erro) {
    mostrarMsg("perfilMsg", erro.message || "Erro ao atualizar perfil. Tente novamente.", "err");
  } finally {
    $("btnSalvarPerfil").disabled = false;
    $("btnSalvarPerfil").textContent = "Salvar alterações";
  }
}

function abrirLinkAtual() {
  const link = $("linkDrive").value.trim();

  if (!link) {
    return mostrarMsg("linkMsg", "Nenhum link cadastrado para abrir.", "err");
  }

  window.open(link, "_blank");
}

function sair() {
  limparSessao();
  abrirLogin();
}

function configurarOlhoSenha() {
  const botaoOlho = $("togglePassword");
  const campoSenha = $("loginSenha");
  const eyeIcon = $("eyeIcon");

  if (!botaoOlho || !campoSenha || !eyeIcon) return;

  botaoOlho.addEventListener("click", () => {
    const senhaEstaOculta = campoSenha.type === "password";

    campoSenha.type = senhaEstaOculta ? "text" : "password";

    botaoOlho.setAttribute(
      "aria-label",
      senhaEstaOculta ? "Ocultar senha" : "Mostrar senha"
    );

    eyeIcon.innerHTML = senhaEstaOculta
      ? `
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `
      : `
        <path d="M3 3l18 18"></path>
        <path d="M10.58 10.58A2 2 0 0 0 13.42 13.42"></path>
        <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19"></path>
        <path d="M6.61 6.61C3.98 8.38 2 12 2 12s3 8 10 8a10.8 10.8 0 0 0 5.39-1.39"></path>
      `;
  });
}

function configurarOlhoSenhaPerfil() {
  const botaoOlho = $("togglePerfilPassword");
  const campoSenha = $("perfilSenha");
  const eyeIcon = $("perfilEyeIcon");

  if (!botaoOlho || !campoSenha || !eyeIcon) return;

  botaoOlho.addEventListener("click", () => {
    const senhaEstaOculta = campoSenha.type === "password";

    campoSenha.type = senhaEstaOculta ? "text" : "password";

    botaoOlho.setAttribute(
      "aria-label",
      senhaEstaOculta ? "Ocultar senha" : "Mostrar senha"
    );

    eyeIcon.innerHTML = senhaEstaOculta
      ? `
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `
      : `
        <path d="M3 3l18 18"></path>
        <path d="M10.58 10.58A2 2 0 0 0 13.42 13.42"></path>
        <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19"></path>
        <path d="M6.61 6.61C3.98 8.38 2 12 2 12s3 8 10 8a10.8 10.8 0 0 0 5.39-1.39"></path>
      `;
  });
}

function configurarEventos() {
  $("btnLogin").addEventListener("click", login);

  $("loginSenha").addEventListener("keydown", event => {
    if (event.key === "Enter") login();
  });

  configurarOlhoSenha();
  configurarOlhoSenhaPerfil();

  $("btnBuscar").addEventListener("click", buscarLoja);

  $("codigoLoja").addEventListener("keydown", event => {
    if (event.key === "Enter") buscarLoja();
  });

  $("btnSalvarLink").addEventListener("click", salvarLink);
  $("btnAbrirLink").addEventListener("click", abrirLinkAtual);

  $("btnLojas").addEventListener("click", abrirLojas);
  $("btnMeuPerfil").addEventListener("click", abrirPerfil);
  $("btnSalvarPerfil").addEventListener("click", salvarPerfil);

  $("btnSair").addEventListener("click", sair);
}

document.addEventListener("DOMContentLoaded", () => {
  configurarEventos();

  if (carregarSessao()) {
    abrirApp();
  } else {
    abrirLogin();
  }
});