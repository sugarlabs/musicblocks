<?php
//    require('./libs/fpdf.php');
//    require('./libs/WriteHTML.php');
require_once('pdf_generator.php');

    $path = "";
    $menu_title = "";
    $menu_image = "";
    $menu_html = "";
    $showMenu = False;
    $expandMenu = False;
    $expandExample = False;
    $expandTutorial = False;
    $expandComponents = False;
if(isset($_GET["page"] )){

        $page = strval($_GET["page"]);
        //welcome
        if( $page == "welcome" )
            $path = "./pages/welcome.php";
        //getting started
        else if( $page == "get_started")
            $path = "./pages/get_started.html";
        else if( $page == "quick_start")
            $path = "./pages/quick_start.html";
        else if( $page == "introduction")
            $path = "./pages/introduction.html";
        //components of the MB
        else if( $page == "components")
        {
            $path = "./pages/components.html";
            $expandComponents = True;
        }
        //main tool
        else if( $page == "main_tool")
            $path = "./pages/main_tool.html";
        //auxiliary tool
        else if( $page == "auxiliary_tool")
            $path = "./pages/auxiliary_tool.html";
        //palette
        else if( $page == "palette_tool")
        {
            $path = "./pages/palette/palette_tool.html";
            $expandMenu = True;
        }
        //music
        else if( $page == "palette_music")
            $path = "./pages/palette/palette_music.html";
        else if( $page == "rhythm")
        {
            $path = "./pages/music/rhythm.html";
            $menu_title = "Rhythm";
            $menu_image = "./dist/img/rhythm.png";
            $menu_html = "./pages/palette/rhythm_block.html";
            $showMenu = True;
        }
        else if( $page == "pitch")
        {
            $path = "./pages/music/pitch.html";
            $menu_title = "Pitch";
            $menu_image = "./dist/img/pitch.png";
            $menu_html = "./pages/palette/pitch_block.html";
            $showMenu = True;
        }
        else if( $page == "tone")
        {
            $path = "./pages/music/tone.html";
            $menu_title = "Tone";
            $menu_image = "./dist/img/tone.png";
            $menu_html = "./pages/palette/tone_block.html";
            $showMenu = True;
        }
        else if( $page == "interval")
        {
            $path = "./pages/music/interval.html";
            $menu_title = "Interval";
            $menu_image = "./dist/img/intervals.png";
            $menu_html = "./pages/palette/interval_block.html";
            $showMenu = True;
        }
        else if( $page == "drum")
        {
            $path = "./pages/music/drum.html";
            $menu_title = "Drum";
            $menu_image = "./dist/img/drums.png";
            $menu_html = "./pages/palette/drum_block.html";
            $showMenu = True;
        }
        else if( $page == "widget")
        {
            $path = "./pages/music/widget.html";
            $menu_title = "Widget";
            $menu_image = "./dist/img/widget.png";
            $menu_html = "./pages/palette/widget_block.html";
            $showMenu = True;
        }

        //graphic
        else if( $page == "palette_graphics")
        {
            $path = "./pages/graphics/palette_graphics.html";
        }
        else if( $page == "mouse")
        {
            $path = "./pages/graphics/mouse.html";
            $menu_title = "Mouse";
            $menu_image = "./dist/img/mouse.png";
            $menu_html = "./pages/palette/mouse_block.html";
            $showMenu = True;
        }
        else if( $page == "pen")
        {
            $path = "./pages/graphics/pen.html";
            $menu_title = "Pen";
            $menu_image = "./dist/img/pen.png";
            $menu_html = "./pages/palette/pen_block.html";
            $showMenu = True;
        }

        //programming
        else if( $page == "palette_program")
        {
            $path = "./pages/program/palette_program.html";
        }
        else if( $page == "flow")
        {
            $path = "./pages/program/flow.html";
            $menu_title = "Flow";
            $menu_image = "./dist/img/flow.png";
            $menu_html = "./pages/palette/flow_block.html";
            $showMenu = True;
        }
        else if( $page == "action")
        {
            $path = "./pages/program/action.html";
            $menu_title = "Action";
            $menu_image = "./dist/img/action.png";
            $menu_html = "./pages/palette/action_block.html";
            $showMenu = True;
        }
        else if( $page == "box")
        {
            $path = "./pages/program/box.html";
            $menu_title = "Box";
            $menu_image = "./dist/img/boxes.png";
            $menu_html = "./pages/palette/box_block.html";
            $showMenu = True;
        }
        else if( $page == "number")
        {
            $path = "./pages/program/number.html";
            $menu_title = "Number";
            $menu_image = "./dist/img/number.png";
            $menu_html = "./pages/palette/number_block.html";
            $showMenu = True;
        }
        else if( $page == "boolean")
        {
            $path = "./pages/program/boolean.html";
            $menu_title = "Boolean";
            $menu_image = "./dist/img/boolean.png";
            $menu_html = "./pages/palette/boolean_block.html";
            $showMenu = True;
        }
        else if( $page == "sensor")
        {
            $path = "./pages/program/sensor.html";
            $menu_title = "Sensor";
            $menu_image = "./dist/img/sensor.png";
            $menu_html = "./pages/palette/sensor_block.html";
            $showMenu = True;
        }
        else if( $page == "heap")
        {
            $path = "./pages/program/heap.html";
            $menu_title = "Heap";
            $menu_image = "./dist/img/heap.png";
            $menu_html = "./pages/palette/heap_block.html";
            $showMenu = True;
        }

        //extra
        else if( $page == "palette_extra")
        {
            $path = "./pages/extra/palette_extra.html";
        }
        else if( $page == "media")
        {
            $path = "./pages/extra/media.html";
            $menu_title = "Media";
            $menu_image = "./dist/img/media.png";
            $menu_html = "./pages/palette/media_block.html";
            $showMenu = True;
        }
        else if( $page == "extras")
        {
            $path = "./pages/extra/extras.html";
            $menu_title = "Extra";
            $menu_image = "./dist/img/extras.png";
            $menu_html = "./pages/palette/extra_block.html";
            $showMenu = True;
        }
        //tutorials
        else if( $page == "tutorial")
        {
            $expandTutorial = True;
            $path = "./pages/tutorial/tutorial_main.php";
        }
        else if( $page == "make_sound")
        {
            $expandTutorial = True;
            $path = "./pages/tutorial/make_a_sound.html";
        }
        else if( $page == "programming_mb")
        {
            $path = "./pages/tutorial/programming_with_mb.html";
            $expandTutorial = True;
        }
        else if( $page == "graphics")
        {
            $path = "./pages/tutorial/graphics.html";
            $expandTutorial = True;
        }
        else if( $page == "widgets")
        {
            $path = "./pages/tutorial/widgets.html";
            $expandTutorial = True;
        }
        //examples
        else if( $page == "example")
        {
            $expandExample = True;
            $path = "./pages/example/example_main.php";
        }
        else if( $page == "hcb")
            $path = "./pages/example/example_hcb.html";
        //documentation
        else if( $page == "documentation")
            $path = "./pages/documentation.html";
        //contribution
        else if( $page == "contribution")
            $path = "./pages/contribution.php";
        //glossary
        else if( $page == "glossary")
            $path = "./pages/glossary.html";
        //FAQ
        else if( $page == "faq")
            $path = "./pages/faq.html";
        //credits
        else if( $page == "credits")
            $path = "./pages/credits.html";
        //download pdf user guide
        else if( $page == "download_pdf")
            generatePDFUserGuide();
    }
    else{
        $path = "./pages/welcome.php";
    }
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"">
    <title>Blocks User Manual</title>

    <link href="./vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
    <link href="./vendor/metisMenu/metisMenu.min.css" rel="stylesheet">
    <link href="./dist/css/sb-admin-2.css" rel="stylesheet">
    <link href="./dist/css/music_blocks.css" rel="stylesheet">
    <link href="./vendor/font-awesome/css/font-awesome.min.css" rel="stylesheet" type="text/css">
</head>
<body>
    <div id="wrapper">
        <nav class="navbar navbar-default navbar-fixed-top" role="navigation" style="margin-bottom: 0">
            <div class="navbar-header">
                <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
                    <span class="sr-only">Toggle navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
                <a class="navbar-brand" href="#">Music Blocks User Manual</a>
            </div>

            <div id="navigation_bar" class="navbar-default sidebar" role="navigation">

                <div class="sidebar-nav navbar-collapse" id="sidebar_menu_div">
                    <?php include "./pages/menu.php" ?>
                </div>
            </div>
        </nav>

        <div id="page-wrapper">
            <div class="container-fluid" id="content_div" >
                <div class="row">
                    <div class="col-lg-12">
                        <?php include $path; ?>
                    </div>
                </div>
            </div>
        </div>

    </div>
	<br/>

	<footer class="footer">
      <div class="container">
        <p align="center"><small><a href="https://github.com/Tharangi/MusicBlocksUserManual-GSoC-2017/blob/master/License.txt">Copyright © 2017 by Dinuka Tharangi Jayaweera.</a> <br/>Webpage Licensed under <a href="https://www.gnu.org/licenses/agpl-3.0.en.html" target="_blank">GNU Affero General Public License</a>.Source code can be found<a href="https://github.com/Tharangi/MusicBlocksUserManual-GSoC-2017" target="_blank"> here</a>. </small></p>
      </div>
    </footer>

    <script src="./vendor/jquery/jquery.min.js"></script>
    <script src="./vendor/bootstrap/js/bootstrap.min.js"></script>
    <script src="./vendor/filestyles/bootstrap-filestyle.min.js"></script>
    <script src="./vendor/metisMenu/metisMenu.min.js"></script>
    <script src="./dist/js/sb-admin-2.js"></script>
    <script src="./dist/js/menu_actions.js"></script>
    <script src="./dist/js/example_page_actions.js"></script>
    <?php

        if($showMenu)
        {
            echo '<script type="text/javascript"> showBlocks("';
            echo $menu_title;
            echo '","';
            echo $menu_image;
            echo '");</script>';
        }

        if($expandMenu)
        {
            echo '<script type="text/javascript"> showExpandedMenu();</script>';
        }
        if($expandTutorial)
        {
            echo '<script type="text/javascript"> showExpandedTutorials();</script>';
        }
        if($expandExample)
        {
            echo '<script type="text/javascript"> showExpandedExamples();</script>';
        }
        if($expandComponents)
        {
            echo '<script type="text/javascript"> showExpandedComponents();</script>';
        }
    ?>
</body>
</html>
