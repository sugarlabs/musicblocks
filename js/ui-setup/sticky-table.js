/**
 * MusicBlocks Sticky Table Extension
 *
 * @author Walter Bender
 *
 * @copyright 2026 Walter Bender
 *
 * @license
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
(function ($) {
    $.fn.fixMe = function () {
        return this.each(function () {
            let $this = $(this),
                $t_fixed;

            function init() {
                $this.wrap('<div class="container" />');
                $t_fixed = $this.clone();
                $t_fixed.find("tbody").remove().end().addClass("fixed").insertBefore($this);
                resizeFixed();
            }

            function resizeFixed() {
                setTimeout(function () {
                    $t_fixed.find("th").each(function (index) {
                        $(this).css("width", $this.find("th").eq(index).outerWidth() + "px");
                    });
                }, 100);
            }

            function scrollFixed() {
                let offset = $(this).scrollTop(),
                    tableOffsetTop = $this.offset().top,
                    tableOffsetBottom =
                        tableOffsetTop + $this.height() - $this.find("thead").height();

                if (offset < tableOffsetTop || offset > tableOffsetBottom) {
                    $t_fixed.hide();
                } else if (
                    offset >= tableOffsetTop &&
                    offset <= tableOffsetBottom &&
                    $t_fixed.is(":hidden")
                ) {
                    $t_fixed.show();
                }
            }

            $(window).resize(resizeFixed);
            $(window).scroll(scrollFixed);
            init();
        });
    };
    jQuery;

    $(document).ready(function () {
        $("solfa").fixMe();
        $(".up").click(function () {
            $("html, body").animate(
                {
                    scrollTop: 0
                },
                2000
            );
        });
    });
})(jQuery);
