#%%
from flask import Flask, render_template
import os

# Get the parent directory (project root)
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

app = Flask(__name__, template_folder=root_dir, static_folder=root_dir, static_url_path='')

@app.route('/')
def hello():
  return render_template('index.html')
  
@app.route("/qr_scanning") 
def qr_coding(): 
    return render_template('../qr_coding.html') 

if __name__ == '__main__':
  app.run()

# %%
