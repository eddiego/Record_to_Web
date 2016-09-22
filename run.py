# -- coding: utf-8 --
from flask import Flask, request, render_template, jsonify, abort
import os
import base64
import datetime
import uuid
import wave
import audioop
import StringIO
import subprocess

app = Flask(__name__)

wavpath = 'static/wav/'
outrate = 16000

def savewav(filename, raw, inrate):
    try:
        s_read = wave.open(StringIO.StringIO(raw), 'r')
        s_write = wave.open(filename, 'w')
        n_frames = s_read.getnframes()
        data = s_read.readframes(n_frames)

        if inrate is not outrate:
            converted = audioop.ratecv(data, 2, 1, inrate, outrate, None)[0]

        s_write.setparams((1, 2, outrate, 0, 'NONE', 'Uncompressed'))
        s_write.writeframes(converted)
        s_read.close()
        s_write.close()
    except:
        print 'failed to save wav file'
        return False

    return True

def getresult(filename, model):
    cmd = 'wc -c ' + filename
    output = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE).communicate()[0]
    if 'ERROR (' in output or 'ASSERTION_FAILED (' in output:
        return False, 'Error'
    else:
        return True, output

@app.route('/record', methods =  ['POST'])
def record():
    if request.method == 'POST':
        content = request.get_json(force=True)
        cfg = content['config']
        audio = content['audio']['content'].encode('UTF-8')
        model = content['config']['languageCode'].encode('UTF-8')
        samplerate =  content['config']['sampleRate']
        raw = base64.b64decode(audio)
        print model,samplerate,'Hz  len=',len(raw)

        filename = '{}{}.wav'.format(wavpath, uuid.uuid4())
        if not savewav(filename, raw, samplerate):
            abort(500)
        ret, ret_str = getresult(filename, model)
        if not ret:
            abort(500)

    return jsonify(results = ret_str, time = datetime.datetime.now().strftime("%Y-%m-%d %I:%M %p"))

@app.route('/')
def home():
    return render_template("index.html", title='list up', files = os.listdir('.'))

if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=7071)
