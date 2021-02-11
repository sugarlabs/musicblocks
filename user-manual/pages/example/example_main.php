<section id="hcb-examples">
	<h1 class="page-header">Examples with Music Blocks</h1>
		<br/>
		<div class="row">
			<div class="col-md-offset-1 col-md-3 col-xs-3">Search by Used Blocks:</div>
			<div class="col-md-7"><input type="text" class="light-table-filter form-control" data-table="order-table" placeholder="Search for blocks..."></div>
		</div>
		<br/>
		<div class="row">
			<div class="col-md-12 col-xs-12">
				<table class="order-table table" id="example-table">
					<thead class="thead-default">
					<tr>
						<th class="col-md-3">Song</th>
						<th class="col-md-4">Listen/ Download/ Open in Music Blocks</th>
						<th class="col-md-5">Used Blocks</th>
					</tr>
					</thead>
					<tbody>
					<tr>
						<td>
                            <a href="#">Frère Jacques</a>

                        </td>
						<td>
							<audio controls>
								<source src="./dist/resources/example_frere/frere-ja.mp3" type="audio/mpeg">
							</audio>
							<a class="glyphicon glyphicon-new-window" href="https://walterbender.github.io/musicblocks/index.html?file=MusicBlocks_Fr%C3%A8re_Jacques.tb&run=True" target="_blank"></a>
						</td>
						<td>Start, Action, Chunk, Repeat, Forever, Adjust transposition, Silence, Notevalue, Pitch</td>
					</tr>
					<tr>
						<td>
                            <a href="#">Frère Jacques - Interactive</a>
                            
                        </td>
                        <td>
							<audio controls>
								<source src="./dist/resources/example_frere/frere-ja.mp3" type="audio/mpeg">
							</audio>
							<a class="glyphicon glyphicon-new-window" href="https://walterbender.github.io/musicblocks/index.html?file=MusicBlocks_Frère_Jacques__Interactive.tb&run=True" target="_blank"></a>
						</td>
						<td>Start, Action, Chunk, Repeat, Forever, Store-in, Box, If-then, Greater-than, Add, Cursor-x, Cursor-y, Do, Plus (arithmatic), Notevalue, Pitch</td>
					</tr>
					<tr>
						<td>
                            <a href="#">Hot Cross Buns - First Form Discovery Start</a>
                            
                        </td>
						<td>
							<audio controls>
								<source src="./dist/resources/example_hcb/all.mp3" type="audio/mpeg">
							</audio>
							<a class="glyphicon glyphicon-new-window" href="https://walterbender.github.io/musicblocks/index.html?file=MusicBlocks_Hot_Cross_Buns__First_Form_Discovery_Start.tb" target="_blank"></a>
						</td>
						<td>Start, Action, Chunk, Repeat, Notevalue, Pitch</td>
					</tr>
					<tr>
						<td>
                            <a href="<?php echo $PATH_PREFIX ?>page=hcb">Hot Cross Buns</a>
                            
                        </td>
						<td>
							<audio controls>
								<source src="./dist/resources/example_hcb/all.mp3" type="audio/mpeg">
							</audio>
							<a class="glyphicon glyphicon-new-window" href="https://walterbender.github.io/musicblocks/index.html?file=MusicBlocks_HCB_all.tb&run=True" target="_blank"></a>
						</td>
						<td>Rhythm, Pitch, Action, Repeat, Duplication, Chunk, Start, Drums</td>
					</tr>
					</tbody>
				</table>
			</div>
		</div>
</section>
