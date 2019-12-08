window.p;

window.makePlanet = function(isMusicBlocks,storage,translationFunction) {
    window._=translationFunction;
    window.p = new Planet(isMusicBlocks,storage);
    window.p.init().then(()=>{
        let numTimes = 0;
        let retryOnPlanetLoad = setInterval(()=>{
            if(parent.onPlanetLoad){
                parent.onPlanetLoad();
                clearInterval(retryOnPlanetLoad);
            } else {
                console.log("Project not ready to load yet, retrying in 1 second...");
                numTimes++;
            }
            if(numTimes > 5) parent.location.reload();
        }, 1000);    
    });
};
