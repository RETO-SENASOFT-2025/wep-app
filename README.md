python -m venv .venv
source .venv/bin/activate

<!-- Una vez -->

pip install --upgrade pip wheel setuptools cryptography
pip install -r requirements.txt --upgrade

<!-- Varias veces -->

python -m ruff check .
python -m ruff format .

-> deactivate
