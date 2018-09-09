;var options = {poll_time: 200},
     localStorageShim = (function(options)
{
    var localStorageShim,
        db_name    = '__localStorageShim',
        table_name = 'pairs',
        err_name   = 'localStorageShim Error: '
        
    const init = []

    try
    {
        localStorage.setItem('a', 4)
        if(localStorage.getItem('a')!=4)
            throw 1
        
        localStorageShim = function()
        {
            this.setItem = function(n, v) { return localStorage.setItem(n, v) }
            this.getItem = function(n) { return localStorage.getItem(n) }
        }
    }
        catch(e)
    {
        localStorageShim = function()
        {
            var idb, ostorage, tick, IDB = indexedDB.open(db_name, 7),
                Storage = {},

                run_get = function()
                {
                    ostorage = db.transaction(table_name).objectStore(table_name)
                    ostorage.openCursor().onsuccess = function(event)
                    {
                        
                        var idbval, k, v,
                        cursor = event.target.result;
                        
                        if(cursor)
                        {
                            idbval = cursor.value
                            Storage[idbval.k] = [idbval.v, cursor.key]

                            cursor.continue();
                        }
                    }
                },

                set_update = function(k, v)
                {
                    k = k+''
                    v = v+''

                    if(Storage[k] && Storage[k][0] === v) return;

                    Storage[k] = Storage[k] || []
                    Storage[k][0] = v

                    clearInterval(tick)

                    ostorage = db.transaction(table_name, 'readwrite').objectStore(table_name)
                    
                    var put = [{k: k, v: v}]
                    if(Storage[k][1]) put.push(Storage[k][1])
                    ostorage = ostorage.put.apply(window, put)
                    ostorage.onsuccess = run_tick
                },
                
                run_tick = function()
                {
                    run_get()
                    tick = setInterval(run_get, options.poll_time)
                }


            IDB.onupgradeneeded = function(event) {
                var idb, db = event.target.result;
                
                try
                {
                    idb = event.target.transaction.objectStore(table_name);
                }
                    catch(e)
                {
                    idb = db.createObjectStore(table_name, {autoIncrement: true});
                }

                try
                {  
                    idb.createIndex("k", "k", { unique: true });
                    idb.createIndex("v", "v", { unique: false });

                    idb.transaction.oncomplete = function(event)
                    {
                        var ostorage = db.transaction(table_name, 'readwrite').objectStore(table_name);
                        for (var i in init)
                            ostorage.add(init[i]);
                    }
                } catch(e){}
            }
            
            IDB.onsuccess = function(event)
            {
                    
                db = event.target.result;
                ostorage = db.transaction(table_name, 'readwrite').objectStore(table_name);
                run_tick()
            }

            this.getItem = function(k)
            {
                if(!k)
                {
                    throw err_name + 'one arguments required';
                    return;
                }
                return Storage[k+''] ? Storage[k+''][0] : undefined;
            }

            this.setItem = function(k, v)
            {
                if(!k || !v)
                {
                    throw err_name + 'two arguments required';
                    return;
                }
                set_update(k, v)
            }
        }
    }

    return new localStorageShim;

})(options);