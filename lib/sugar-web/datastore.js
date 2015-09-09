define(["sugar-web/env", "sugar-web/datastore/sugarizer", "sugar-web/datastore/sugaros"], function(env, sugarizer, sugaros) {

    'use strict';

    var datastore ;

    if (env.isSugarizer()) {
        datastore = sugarizer;
    } else {
        datastore = sugaros;
    }

    return datastore;
});
