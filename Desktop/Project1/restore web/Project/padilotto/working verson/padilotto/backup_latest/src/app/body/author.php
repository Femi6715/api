<div class="rounded p-4 border my-5">
	<div class="row align-items-center text-md-center">
		<div class="col-md-3">
			<img src="<?php echo get_avatar_url( get_the_author_meta( 'ID' ) ); ?>" class="circle img-fluid border" width="150" height="150">
		</div>
		<div class="col-md">
			<h4><?php the_author(); ?></h4>
			<?php echo get_the_author_meta( 'user_description', $post->post_author ); ?>
		</div>
	</div>
</div>