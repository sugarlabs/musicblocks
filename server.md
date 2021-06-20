Server
======

Running a local server
----------------------

[Clone the server](https://github.com/tchx84/turtleblocksjs-server) and
[change the api key]
(https://github.com/tchx84/turtleblocksjs-server/blob/master/settings.py#L26)
to your TurtleJS key.

Install apache and turtleblocksjs.

Setup a link to /var/www/html
```
sudo apt-get install apache2
cd /var/www
sudo ln -s /home/path/to/app/ html
```

Then, enable the 'proxy' modules in apache.
```
cd /etc/apache2/mods-enabled 
sudo ln -s ../mods-available/proxy* . 
sudo ln -s ../mods-available/xml2enc.load .
sudo ln -s ../mods-available/slotmem_* .
```

Remove the alias module.
```
sudo unlink alias.conf
sudo unlink alias.load
```

Apache TurtleJS Config
----------------------

Copy this into `/etc/apache2/sites-enabled/turtlejs.conf`

```
<VirtualHost *:80 *:443>
    DocumentRoot /var/www/html

    ProxyPreserveHost On
    ProxyPass /server http://127.0.0.1:3000
    ProxyPassReverse /server http://127.0.0.1:3000

    <Location /server>
        Order allow,deny
        Allow from all
    </Location>

</Virtualhost>
```
Then, restart apache.
```sudo service apache2 restart```

Now, you need to run the TurtleJS server.

```
cd /home/path/to/server/ 
./server.py
```
If everything is ok in your browser you should able to access to
<pre>localhost</pre> and see TurtleJS instance.
