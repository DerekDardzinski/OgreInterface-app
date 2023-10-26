# pyinstaller --noconsole  --noconfirm  --distpath ./resources app.py  --collect-all pymatgen  --collect-all OgreInterface --collect-all spglib 
pyinstaller --noconsole  --noconfirm  --distpath ./resources app.py  --collect-data pymatgen  --collect-data OgreInterface --collect-data spglib 
