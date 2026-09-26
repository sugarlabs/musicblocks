# -*- coding: utf-8 -*-
import sys
sys.path.insert(1, '..')
from pluginify import pluginify
import os

files = os.listdir('.')
for f in files:
    if not os.path.exists(f) or not f.endswith('.rtp'): 
        continue

    with open(f) as fr:
        data = fr.read()
        fr.close()
        del fr

    fr = open(f[:-4] + '.json', 'w')
    fr.write(pluginify(data))
    fr.close()