<section class="page-content-div" id="contribution-page">
    <h1 class="page-header">How make contributions to Music Blocks</h1>
    <p class="text-justify">You can contribute to the MB by uploading your projects as examples.</p>
    <br/>
    <form name="contributions_form" action="" method="post" enctype="multipart/form-data">
        <div class="form-group">
            <label for="projectTitle">Title *</label>
            <input type="text" class="form-control" name="projectTitle" id="projectTitle" placeholder="Enter title">
            <small class="form-text text-muted">Title of the project</small>
        </div>
        <div class="form-group">
            <label for="projectFile">Project file *</label>
            <input type="file" class="form-control filestyle" id="projectFile" name="projectFile" data-buttonName="btn-primary" data-buttonText="&nbsp;Browse" data-placeholder="Choose a .tb file" readonly>
            <small class="form-text text-muted">Upload the .tb file of the project</small>
        </div>
        <div class="form-group">
            <label for="projectDescription">Description *</label>
            <textarea class="form-control" name="projectDescription" id="projectDescription" rows="4"></textarea>
            <small class="form-text text-muted">Description about the example, with notes and other important information.</small>
        </div>
        <hr/>
        <div class="form-group">
            <label for="projectTitle">Project video</label>
            <input type="text" class="form-control" name="projectVideo" id="projectVideo" placeholder="Enter URL">
            <small class="form-text text-muted">Optional: Video url the project</small>
        </div>
        <div class="form-group">
            <label for="name">Name</label>
            <input type="text" class="form-control" name="name" id="name" placeholder="Enter name">
            <small class="form-text text-muted">Optional: Your name will be shown with the example</small>
        </div>
        <div class="form-group">
            <label for="linkToProfile">Link to profile</label>
            <input type="text" class="form-control" name="linkToProfile" id="linkToProfile" placeholder="Enter link to profile">
            <small class="form-text text-muted">Optional: By filling this, others will get to know about you</small>
        </div>
        <button type="submit" name="submit" class="btn btn-primary">Submit</button>
    </form>
</section>

<?php

$proj_title_err = $proj_description_err = $project_file_err = $project_video_err = $user_name_error = $user_profile_error = "";
$proj_title = $project_description = $project_file = $project_video = $user_name = $user_profile = "";

$error = false;

if(isset($_POST["submit"]))
{
    if ($_SERVER["REQUEST_METHOD"] == "POST") {

        if (empty($_POST["projectTitle"])) {
            $proj_title_err = "Project title is required";
            $error = $error || true;
        } else {
            $proj_title = modify_values($_POST["projectTitle"]);
            if (!preg_match("/^[a-zA-Z ]*$/",$proj_title)) {
                $proj_title_err = "Only letters and white space allowed";
                $error = $error || true;
            }
        }

        $file_name = $_FILES["projectFile"]["name"];
        $tmp_name  = $_FILES['projectFile']['tmp_name'];
        $file_size = $_FILES['projectFile']['size'];
        $file_type = pathinfo($file_name, PATHINFO_EXTENSION);
        $content = null;
        if($file_type != 'tb'){
            $project_file_err = "Not an acceptable file type.";
            $error = $error || true;
        }else if($file_size === 0){
            $project_file_err = "Invalid file. File should not be empty";
            $error = $error || true;
        }
        else{
            $fp      = fopen($tmp_name, 'r');
            $content = fread($fp, filesize($tmp_name));
            $content = addslashes($content);
            fclose($fp);
            if(!get_magic_quotes_gpc())
            {
                $file_name = addslashes($file_name);
            }
        }

        if (!empty($_POST["projectVideo"])) {
            $project_video = modify_values($_POST["projectVideo"]);
            if (!preg_match("/\b(?:(?:https?|ftp):\/\/|www\.)[-a-z0-9+&@#\/%?=~_|!:,.;]*[-a-z0-9+&@#\/%=~_|]/i",$project_video)) {
                $project_video_err = "Invalid video URL";
                $error = $error || true;
            }
        }

        if (empty($_POST["projectDescription"])) {
            $proj_description_err = "Project description is required";
            $error = $error || true;
        } else {
            $project_description = modify_values($_POST["projectDescription"]);
        }

        if( !empty($_POST["name"]) ){
            $user_name = modify_values($_POST["name"]);
        }

        if( !empty($_POST["linkToProfile"]) ){
            $user_profile = modify_values($_POST["linkToProfile"]);
            if (!preg_match("/\b(?:(?:https?|ftp):\/\/|www\.)[-a-z0-9+&@#\/%?=~_|!:,.;]*[-a-z0-9+&@#\/%=~_|]/i",$user_profile)) {
                $user_profile_error = "Invalid profile URL";
                $error = $error || true;
            }
        }

        $output_string = "";
        if($error){
            $output_string = 'Invlid values found\n\n' .
                (empty($proj_title_err) ? '' : ( $proj_title_err . '\n' ) ) .
                (empty($proj_description_err) ? '' : ( $proj_description_err . '\n' ) ) .
                (empty($project_file_err) ? '' : ( $project_file_err . '\n' ) ) .
                (empty($project_video_err) ? '' : ( $project_video_err . '\n' ) ) .
                (empty($user_name_error) ? '' : ( $user_name_error . '\n' ) ) .
                (empty($user_profile_error) ? '' : ( $user_profile_error . '\n' ) );
        }else{

            try{
                $conn = new mysqli("localhost", "root", "", "music_blocks");

                if ($conn->connect_error) {
                    die("Connection failed: " . $conn->connect_error);
                }
                $sql = "INSERT INTO contributions (projectTitle, projectFile, projectFileSize, projectFileContent, projectVideo, projectDescription, userName, linkToProfile) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ssibssss", $proj_title, $file_name, $file_size, $content, $project_video, $project_description, $user_name, $user_profile );
                $stmt->execute();
                $stmt->close();
                $conn->close();
                $output_string = "Successfully submitted the example!";
            }
            catch (Exception $e){
                echo $e;
                $output_string = "Error while saving values!";
            }
        }

        ?>
           <script type="text/javascript">
                alert( "<?php echo $output_string ?>" );
           </script>
        <?php
    }
}

function modify_values($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

?>