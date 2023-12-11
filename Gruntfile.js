
module.exports = function (grunt) {


	grunt.loadNpmTasks('grunt-aws-s3');
	grunt.loadNpmTasks('grunt-cloudfront');


	grunt.initConfig({

		aws_s3: {
			options: {
				accessKeyId: process.env.AWS_KEY_PERSONAL,
				secretAccessKey: process.env.AWS_SECRET_PERSONAL,
				region: 'us-east-1',
				uploadConcurrency: 5, // 5 simultaneous uploads
				downloadConcurrency: 5 // 5 simultaneous downloads
			},
			production: {
				options: {
					bucket: 'free.upscaler.video',
					differential: true // Only uploads the files that have changed
				},
				files: [
					{expand: true,
						cwd: 'dist/',
						src: ['**', '!*~'],
						dest: '/'}
				]
			},
		},

		cloudfront: {
			options: {
				region:'us-east-1', // your AWS region
				distributionId:"E1PI5O74ZD5EVI", // DistributionID where files are stored
				listInvalidations:true, // if you want to see the status of invalidations
				listDistributions:false, // if you want to see your distributions list in the console
				version:"1.0", // if you want to invalidate a specific version (file-1.0.js),
				credentials: {
					accessKeyId: process.env.AWS_KEY_PERSONAL,
					secretAccessKey: process.env.AWS_SECRET_PERSONAL,
				}

			},
			production: {
				CallerReference: Date.now().toString(),
				Paths: {
					Quantity: 1,
					Items: [ '/*' ]
				}
			},
		},




	});

	grunt.registerTask('push', ['aws_s3:production', 'cloudfront:production']);



};
