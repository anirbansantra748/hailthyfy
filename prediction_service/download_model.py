import requests

def download_file(url, filename):
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return filename

if __name__ == "__main__":
    url = "https://github.com/Ayan-10/CheXNet-Keras/releases/download/v1.0/chexnet_14_class_densenet121_224_best.h5"
    filename = "chexnet_model.h5"
    download_file(url, filename)