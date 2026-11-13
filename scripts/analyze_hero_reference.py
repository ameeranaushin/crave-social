from pathlib import Path
import subprocess
from PIL import Image, ImageDraw
import imageio_ffmpeg

root = Path(__file__).resolve().parent.parent
dest = root/'qa/reference-hero'
dest.mkdir(parents=True,exist_ok=True)
video = r'C:\Users\User\Downloads\website inspo.mp4'
times = [0,.2,.4,.6,.8,1,1.25,1.5,1.75,2,2.25,2.5,2.75,3,3.5,4,25.5,26,26.5,27,27.5,28,28.25,28.5,28.75,29]
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
sheet=Image.new('RGB',(1424,((len(times)+3)//4)*230),'#ededed')
d=ImageDraw.Draw(sheet)
for i,time in enumerate(times):
    file=dest/f'{time:.2f}.jpg'
    subprocess.run([ffmpeg,'-loglevel','error','-y','-ss',str(time),'-i',video,'-frames:v','1',str(file)],check=True)
    im=Image.open(file).resize((356,204))
    x=(i%4)*356; y=(i//4)*230
    sheet.paste(im,(x,y)); d.text((x+8,y+210),str(time)+' seconds',fill='black')
sheet.save(dest/'sequence.jpg')
print('Hero sequence extracted:',dest)
