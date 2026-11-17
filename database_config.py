import os

from dotenv import load_dotenv

load_dotenv()

SQL_SERVER = os.getenv("SQL_SERVER", "10.0.0.1\\COMPAC")
SQL_DATABASE = os.getenv("SQL_DATABASE", "BD_Inventario_YGO")
SQL_USERNAME = os.getenv("SQL_USERNAME")
SQL_PASSWORD = os.getenv("SQL_PASSWORD")


def get_connection_string():
    missing_settings = [
        name
        for name, value in (
            ("SQL_USERNAME", SQL_USERNAME),
            ("SQL_PASSWORD", SQL_PASSWORD),
        )
        if not value
    ]
    if missing_settings:
        raise RuntimeError(
            "Faltan variables SQL en el archivo .env: "
            + ", ".join(missing_settings)
        )

    return (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={SQL_SERVER};DATABASE={SQL_DATABASE};"
        f"UID={SQL_USERNAME};PWD={SQL_PASSWORD};"
        "Encrypt=no;TrustServerCertificate=yes;"
    )
