const app = new PIXI.Application({
    background: '#1099bb',
    resizeTo: window,
    
});
document.body.appendChild(app.view);

var a = 0

function initGame() {
    console.log(app.ticker.deltaTime)
}

function tick(delta) {
    console.log(app.ticker)
}

initGame()

app.ticker.add(tick);