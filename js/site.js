// Comportamentos comuns a todas as páginas: menu mobile, revelação no scroll e vídeo de apresentação.

// ID do vídeo de apresentação da Renata no YouTube (o trecho depois de "v=" no link).
// Ex.: https://www.youtube.com/watch?v=AbCdEf12345 → 'AbCdEf12345'. Vazio = "vídeo em breve".
var VIDEO_APRESENTACAO = '';

(function () {
  // Menu mobile
  var botao = document.querySelector('.nav-toggle');
  var nav = document.getElementById('menu');
  if (botao && nav) {
    botao.addEventListener('click', function () {
      var aberto = nav.classList.toggle('open');
      botao.setAttribute('aria-expanded', aberto);
      botao.textContent = aberto ? 'Fechar' : 'Menu';
    });
  }

  // Revelação no scroll
  var itens = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    itens.forEach(function (el) { obs.observe(el); });
  } else {
    itens.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Vídeo: só carrega o YouTube quando a pessoa clica (página mais leve, sem cookies antes do play)
  document.querySelectorAll('.video').forEach(function (bloco) {
    var play = bloco.querySelector('.video-play');
    if (!play) return;
    if (!VIDEO_APRESENTACAO) {
      play.disabled = true;
      play.querySelector('.rotulo').textContent = 'Vídeo de apresentação em breve';
      var sub = play.querySelector('.sub');
      if (sub) sub.remove();
      return;
    }
    play.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(VIDEO_APRESENTACAO) + '?autoplay=1&rel=0&modestbranding=1';
      iframe.title = 'Vídeo de apresentação — Renata Soares';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      bloco.appendChild(iframe);
      play.remove();
    });
  });
})();
