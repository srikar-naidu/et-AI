# Currency screening model service

This service is deployed independently on Render. It receives a note image and returns a **binary screening result** (`verified` or `counterfeit`) with confidence.

## Train locally

1. Extract `data/raw/currency/indian-currency-real-vs-fake.zip`.
2. Confirm the extracted folders are `data/data/real` and `data/data/fake`.
3. Create a Python environment and install `tensorflow-cpu`, `pillow`, and `scikit-learn`.
4. Run `python scripts/train_counterfeit_model.py --dataset <extracted-folder> --output ml-service/models/counterfeit-screening.keras`.

## Deploy to Render

- Root directory: `ml-service`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Set `MODEL_PATH=models/counterfeit-screening.keras`.

Set the deployed service URL as `COUNTERFEIT_MODEL_API_URL` in the Next.js app environment. Never expose the model service directly to browsers.
