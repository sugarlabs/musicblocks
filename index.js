/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Ajeet Pratap Singh
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const express = require('express');
const compression = require('compression');
const path = require('path');

const app = express();

// Enable compression for all responses
app.use(compression({
  level: 9,
  threshold: 0
}));

app.use(express.static(path.join(__dirname), {
  maxAge: '1h'
}));

const PORT = 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Music Blocks running at http://127.0.0.1:${PORT}/`);
  console.log('Compression enabled');
});