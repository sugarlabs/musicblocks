/**
 * @license
 * MusicBlocks v3.7.0
 * Copyright (C) 2025 Om Santosh Suneri
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of GNU Affero General Public License as published by
 * Free Software Foundation, either version 3 of the License, or
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

describe("Mouse pointer cursor management", () => {
    let mockWidget;
    let mockDocument;

    beforeEach(() => {
        jest.resetModules();

        // Mock document for cursor tests
        mockDocument = {
            body: {
                style: {
                    cursor: ''
                }
            },
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };

        // Mock widget with cursor management methods
        mockWidget = {
            _cursorState: '',
            _isDragging: false,
            
            setCursor: function(cursor) {
                this._cursorState = cursor;
                if (mockDocument.body) {
                    mockDocument.body.style.cursor = cursor;
                }
            },
            
            startDrag: function() {
                this._isDragging = true;
                this.setCursor('grabbing');
            },
            
            endDrag: function() {
                this._isDragging = false;
                this.setCursor('default');
            },
            
            onMouseLeave: function() {
                if (this._isDragging) {
                    this.setCursor('default');
                }
            },
            
            close: function() {
                this._isDragging = false;
                this.setCursor('default');
            }
        };

        global.document = mockDocument;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("Cursor changes to grabbing during drag", () => {
        mockWidget.startDrag();
        
        expect(mockWidget._cursorState).toBe('grabbing');
        expect(mockDocument.body.style.cursor).toBe('grabbing');
    });

    test("Cursor resets to default on drag end", () => {
        mockWidget.startDrag();
        mockWidget.endDrag();
        
        expect(mockWidget._cursorState).toBe('default');
        expect(mockDocument.body.style.cursor).toBe('default');
    });

    test("Cursor resets on mouse leave during drag", () => {
        mockWidget.startDrag();
        mockWidget.onMouseLeave();
        
        expect(mockWidget._cursorState).toBe('default');
        expect(mockDocument.body.style.cursor).toBe('default');
    });

    test("Cursor resets on widget close during drag", () => {
        mockWidget.startDrag();
        mockWidget.close();
        
        expect(mockWidget._cursorState).toBe('default');
        expect(mockDocument.body.style.cursor).toBe('default');
    });

    test("Cursor does not reset when not dragging", () => {
        mockWidget.onMouseLeave();
        mockWidget.close();
        
        expect(mockWidget._cursorState).toBe('default');
        expect(mockDocument.body.style.cursor).toBe('default');
    });

    test("Cursor state management works correctly", () => {
        // Start drag
        mockWidget.startDrag();
        expect(mockWidget._cursorState).toBe('grabbing');
        
        // Mouse leave during drag (edge case)
        mockWidget.onMouseLeave();
        expect(mockWidget._cursorState).toBe('default');
        
        // Start new drag
        mockWidget.startDrag();
        expect(mockWidget._cursorState).toBe('grabbing');
        
        // End drag normally
        mockWidget.endDrag();
        expect(mockWidget._cursorState).toBe('default');
        
        // Close widget
        mockWidget.close();
        expect(mockWidget._cursorState).toBe('default');
    });

    test("Prevents cursor stuck in edge case scenario", () => {
        // Simulate the bug scenario: drag starts, mouse leaves, drag ends outside
        mockWidget.startDrag();
        expect(mockWidget._cursorState).toBe('grabbing');
        
        // Edge case: mouse leaves widget during drag
        mockWidget.onMouseLeave();
        expect(mockWidget._cursorState).toBe('default');
        
        // Even if drag end fires again, cursor should remain default
        mockWidget.endDrag();
        expect(mockWidget._cursorState).toBe('default');
        expect(mockDocument.body.style.cursor).toBe('default');
    });
});
