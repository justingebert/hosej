resource "aws_s3_bucket" "hosej-rally-bucket" {
  bucket = "hosej-rally-bucket"

  tags = {
    Name        = "hosej-rally-bucket-images"
    Enviroment  = "prod"
  }
}

resource "aws_s3_bucket_cors_configuration" "hosej_rally_bucket_cors" {
  bucket = aws_s3_bucket.hosej-rally-bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]
    expose_headers  = []
  }
}