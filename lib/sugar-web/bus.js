define(["sugar-web/env", "sugar-web/bus/sugarizer", "sugar-web/bus/sugaros"], function(env, sugarizer, sugaros) {

    'use strict';

    var bus;

    if (env.isSugarizer()) {
        bus = sugarizer;
    } else {
        bus = sugaros;
    }

    return bus;
});
