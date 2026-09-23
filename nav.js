// Menu mobile: abre e fecha a navegação abaixo de 820px.
(function () {
  var botao = document.querySelector('.nav-toggle');
  var nav = document.getElementById('menu');
  if (!botao || !nav) return;
  botao.addEventListener('click', function () {
    var aberto = nav.classList.toggle('open');
    botao.setAttribute('aria-expanded', aberto);
    botao.textContent = aberto ? 'Fechar' : 'Menu';
  });
})();
