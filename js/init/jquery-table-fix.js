// js/init/jquery-table-fix.js
// jQuery plugin for fixed table headers and scroll-to-top behaviour.
// Extracted from inline script in index.html for CSP compliance.
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

    $(document).ready(function () {
        $("solfa").fixMe();
        $(".up").click(function () {
            $("html, body").animate({ scrollTop: 0 }, 2000);
        });
    });
})(jQuery);

let isDragging = false;
