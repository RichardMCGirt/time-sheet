from flask import Flask, send_file
import comics

app = Flask(__name__)

@app.route('/comic')
def get_comic():
    ch = comics.search("calvinandhobbes").date("January 2, 1990")
    comic_path = "calvinandhobbes.png"
    ch.download(comic_path)
    return send_file(comic_path, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True)
