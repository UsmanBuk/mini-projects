import pandas as pd
import numpy as np
import yaml
from sqlalchemy import create_engine, inspect
import psycopg2
import tabula as tb
import requests
import json
import boto3

class DataExtractor:
    def __init__(self):
        pass


    def read_rds_table(self, table_names, table_name, engine):

        engine = engine.connect()

        data = pd.read_sql_table(table_name, engine)
        return data # it will take in an instance of the database connector class and the table name as an argument and return a pd df
        # Use list_db_tables method to get the name of the table containing user data
        # Use read_rds_table method to extract the table containing user data and return a pd df
        
    def retrieve_pdf_data(self, link):
        pdf_path = link
        df = tb.read_pdf(pdf_path, pages="all")
        df = pd.concat(df)
        df = df.reset_index(drop=True)
        return df

    def list_number_of_stores(self, endpoint, api_key):
        response = requests.get(endpoint, headers=api_key)
        content = response.text
        result = json.loads(content)
        number_stores = result['number_stores']
        
        return number_stores

    def retrieve_stores_data(self, number_stores, endpoint, api_key):
        data = []
        for store in range(0, number_stores):
            response = requests.get(f'{endpoint}{store}', headers=api_key)
            content = response.text
            result = json.loads(content)
            data.append(result)

        df = pd.DataFrame(data)

        return df
    
    def extract_from_s3(self, s3_address):
        s3 = boto3.resource('s3')
        if 's3://' in s3_address:
            s3_address = s3_address.replace('s3://','' )
        elif 'https' in s3_address:
            s3_address = s3_address.replace('https://', '')

        bucket_name, file_key = s3_address.split('/', 1)
        bucket_name = 'data-handling-public'
        obj = s3.Object(bucket_name, file_key)
        body = obj.get()['Body']
        if 'csv' in file_key:
            df = pd.read_csv(body)
        elif '.json' in file_key:
            df = pd.read_json(body)
        df = df.reset_index(drop=True)
        return df

 


extractor = DataExtractor()
