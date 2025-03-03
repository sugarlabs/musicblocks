/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2024 omsuneri
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

module.exports = {
    testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).[jt]s?(x)'],
    clearMocks: true,
    moduleFileExtensions: ['js', 'json', 'node'],
    testEnvironment: 'jsdom',
};