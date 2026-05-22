from youtube_transcript_api import YouTubeTranscriptApi

video_id = "kqtD5dpn9C8" # The FreeCodeCamp video

print(f"Attempting to fetch transcript for: {video_id}")

try:
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    print("SUCCESS! Here is the first line of the transcript:")
    print(transcript[0])
except Exception as e:
    print(f"FAILED. Here is the exact error YouTube threw:")
    print(str(e))