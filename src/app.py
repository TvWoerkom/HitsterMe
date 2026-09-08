#%%
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def hello():
  return render_template('index.html')
  
@app.route("/qr_scanning") 
def qr_coding(): 
    return render_template('qr_coding.html') 

if __name__ == '__main__':
  app.run()

# %%
