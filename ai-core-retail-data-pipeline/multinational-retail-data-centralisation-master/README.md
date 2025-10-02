# multinational-retail-data-centralisation

This was a scenario based project set by Ai Core forming part of the data science career accelerator. This scenario aimed to build skills in data extraction and cleaning from multiple sources in python before uploading the data to a postgres database. The database schema was then designed using the star schema and the data was then queried using PostgreSQL to provide data driven insights for the scenario outlined below.

Scenario: You work for a multinational company that sells various goods across the globe. Currently, their sales data is spread across many different data sources making it not easily accessible or analysable by current members of the team. In an effort to become more data-driven, your organisation would like to make its sales data accessible from one centralised location. Your first goal will be to produce a system that stores the current company data in a database so that it's accessed from one centralised location and acts as a single source of truth for sales data. You will then query the database to get up-to-date metrics for the business.

## Mileston 1 - Data Extraction and Cleaning.

- Data was extracted from multiple sources (RDS Tables, PDF's, API's, AWS S3 Buckets.

The following code was written in order to extract and clean the data

- RDS Tables
- Connecting to the tables
```
    def read_db_creds(self):
        with open("db_creds.yaml", "r") as f:
            db_creds = yaml.safe_load(f)
        return db_creds

    def init_db_engine(self, db_creds):
        engine = create_engine(f"{db_creds['RDS_DATABASE_TYPE']}+{db_creds['DB_API']}://{db_creds['RDS_USER']}:{db_creds['RDS_PASSWORD']}@{db_creds['RDS_HOST']}:{db_creds['RDS_PORT']}/{db_creds['RDS_DATABASE']}")
        engine.connect()
        
        # Take in the db_creds output and initialise and return an sql_alchemy database engine
        return engine

    def list_db_tables(self, engine):
        engine.connect()
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        return table_names
```

- Extracting the data from a table
```
    def read_rds_table(self, table_names, table_name, engine):
        engine = engine.connect()
        data = pd.read_sql_table(table_name, engine)
        return data
```

- Cleaning the data
```
    def clean_user_data(self, legacy_users_table):
        legacy_users_table.replace('NULL', pd.NaT, inplace=True)
        legacy_users_table.dropna(subset=['date_of_birth', 'email_address', 'user_uuid'], how='any', axis=0, inplace=True)
        legacy_users_table['date_of_birth'] = pd.to_datetime(legacy_users_table['date_of_birth'], errors = 'ignore')
        legacy_users_table['join_date'] = pd.to_datetime(legacy_users_table['join_date'], errors ='coerce')
        legacy_users_table = legacy_users_table.dropna(subset=['join_date'])
        legacy_users_table['phone_number'] = legacy_users_table['phone_number'].str.replace('/W', '')
        legacy_users_table = legacy_users_table.drop_duplicates(subset=['email_address'])
        legacy_users_table.drop(legacy_users_table.columns[0], axis=1, inplace=True)
        
        return legacy_users_table 
```

- Extracting data from a PDF document

```
    def retrieve_pdf_data(self, link):
        pdf_path = link
        df = tb.read_pdf(pdf_path, pages="all")
        df = pd.concat(df)
        df = df.reset_index(drop=True)
        return df
```

- Cleaning the PDF data
```
    def clean_card_data(self, card_data_table):
        card_data_table.replace('NULL', pd.NaT, inplace=True)
        card_data_table.dropna(subset=['card_number'], how='any', axis=0, inplace=True)
        card_data_table = card_data_table[~card_data_table['card_number'].str.contains('[a-zA-Z?]', na=False)]
        card_data_table.to_csv('outputs.csv')
        return card_data_table
```

- Extracting data from an API
```
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
        print(df.head(10))
        return df
```
- Cleaning the data from the API
```
 def clean_store_data(self, store_data):
        store_data = store_data.reset_index(drop=True)
        store_data.replace('NULL', pd.NaT, inplace=True)
        store_data.loc[[31, 179, 248, 341, 375], 'staff_number'] = [78, 30, 80, 97, 39] # individually replaces values that have been inccorectly including text
        store_data.dropna(subset=['address'], how='any', axis=0, inplace=True)
        store_data = store_data[~store_data['staff_number'].str.contains('[a-zA-Z?]', na=False)]
        store_data = store_data.drop('lat', axis = 1)
        store_data['continent'] = store_data['continent'].str.replace('eeEurope', 'Europe').str.replace('eeAmerica', 'America')
        
        return store_data

```

- Extracting multiple data tables from an AWS S3 Bucket in CSV and .json format

```
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


```
- Several methods were created to clean the relevant data extracted from the AWS tables.

```
    def convert_product_data(self, x):
        if 'kg' in x:
            x = x.replace('kg', '')
            x = float(x)

        elif 'ml' in x:
            x = x.replace('ml', '')
            x = float(x)/1000

        elif 'g' in x:
            x = x.replace('g', '')
            x = float(x)/1000

        elif 'lb' in x:
            x = x.replace('lb', '')
            x = float(x)*0.453591
            
        return x

    def clean_product_data(self, data): 
        data.replace('NULL', pd.NaT, inplace=True)
        data['date_added'] = pd.to_datetime(data['date_added'], errors ='coerce')
        data.dropna(subset=['date_added'], how='any', axis=0, inplace=True)
        data['weight'] = data['weight'].apply(lambda x: x.replace(' .', ''))

        temp_cols = data.loc[data.weight.str.contains('x'), 'weight'].str.split('x', expand=True) # splits the weight column intop 2 temp columns split by the 'x'
        numeric_cols = temp_cols.apply(lambda x: pd.to_numeric(x.str.extract('(\d+\.?\d*)', expand=False)), axis=1) # Extracts the numeric values from the temp columns just created
        final_weight = numeric_cols.prod(axis=1) # Gets the product of the 2 numeric values
        data.loc[data.weight.str.contains('x'), 'weight'] = final_weight

        data['weight'] = data['weight'].apply(lambda x: str(x).lower().strip())
        data['weight'] = data['weight'].apply(lambda x: self.convert_product_data(x))
        data.drop(data.columns[1], axis=1, inplace=True) 
        return data
        
    def clean_date_data(self, data):
        data = data[~data['year'].str.contains('[a-zA-Z?]', na=False)]
        data.dropna(subset=['year'], how='any', axis=0, inplace=True)
        return data

```

## Milestone 2 - Data wrangling and formatting with PostgreSQL

- Tables were updated to ensure data were stored in the correct types in all tables. To determine the maximum number of characters for the VARCHAR(?) data, a query was used multiple time, before the output was used in the VARCHAR type. See example below.

```
SELECT length(max(cast(card_number as Text)))
FROM orders_table
GROUP BY card_number
ORDER BY length(max(cast(card_number as Text))) desc
LIMIT 1; 
-- largest number = 19

ALTER TABLE orders_table
	ALTER COLUMN card_number TYPE VARCHAR(19),
	ALTER COLUMN store_code TYPE VARCHAR(12),
	ALTER COLUMN product_code TYPE VARCHAR(11),
	ALTER COLUMN date_uuid TYPE UUID USING CAST(date_uuid as UUID),
	ALTER COLUMN user_uuid TYPE UUID USING CAST(user_uuid as UUID),
	ALTER COLUMN product_quantity TYPE SMALLINT;

```

- To improve readability of the data, a case statement was introduced to the dim_products table.
```
UPDATE dim_products
SET weight_class =
	CASE 
		WHEN weight < 2.0 THEN 'Light'
		WHEN weight >= 2 
			AND weight < 40 THEN 'Mid_Sized'
		WHEN weight >= 40 
			AND weight <140 THEN 'Heavy'
		WHEN weight >= 140 THEN 'Truck_Required'
	END;
	
```

- To complete the database design and schema, primary keys were added to the columns shared by the orders_table (primary table) and dim tables. Primary keys were added to the columns in the dim tables. Before the same columns in the orders_table were made foreign keys.

```
-- Adds primary keys in dim_tables
ALTER TABLE dim_card_details
	ADD CONSTRAINT pk_card_nuber PRIMARY KEY (card_number);
	
ALTER TABLE dim_date_times
	ADD PRIMARY KEY (date_uuid);
	
ALTER TABLE dim_products
	ADD PRIMARY KEY (product_code);
	
ALTER TABLE dim_store_details
	ADD PRIMARY KEY (store_code);
	
ALTER TABLE dim_users
	ADD PRIMARY KEY (user_uuid);
    
-- adss the foreign keys to the orders table
ALTER TABLE orders_table
	ADD FOREIGN KEY (card_number)
	REFERENCES dim_card_details(card_number);
	
ALTER TABLE orders_table
	ADD FOREIGN KEY (date_uuid)
	REFERENCES dim_date_times(date_uuid);
	
ALTER TABLE orders_table
	ADD FOREIGN KEY (product_code)
	REFERENCES dim_products(product_code);
	
ALTER TABLE orders_table
	ADD FOREIGN KEY (store_code)
	REFERENCES dim_store_details(store_code);
	
ALTER TABLE orders_table
	ADD FOREIGN KEY (user_uuid)
	REFERENCES dim_users(user_uuid);
	
```

- Data cleaning was required to ensure the foreign and primary keys matched. The card_numbers that were present in the orders_table and not the dim_card_details table were then inserted into the dim_card_details table.

```
-- Finds all card_numbers in orders_table that are not in dim_card_details
SELECT orders_table.card_number 
FROM orders_table
LEFT JOIN dim_card_details
ON orders_table.card_number = dim_card_details.card_number
WHERE dim_card_details.card_number IS NULL;

-- Inserts all card_numbers from orders_tale not present in dim_card_details initally, into dim_card_details
INSERT INTO dim_card_details (card_number)
SELECT DISTINCT orders_table.card_number
FROM orders_table
WHERE orders_table.card_number NOT IN 
	(SELECT dim_card_details.card_number
	FROM dim_card_details);
```

## Milestone 3 - Querying the database to answer business scenario questions
- Scenario 1
    - How many stores does the business have and in wich countires?
    - The Operations team would like to know which countries we currently operate in and which country now has the most stores.
```
SELECT country_code, COUNT(country_code) as total_no_stores
FROM dim_store_details
GROUP BY country_code
ORDER BY total_no_stores desc;
```

- Scenario 2:
    - Which locations currently have the most stores?
    - The business stakeholders would like to know which locations currently have the most stores.
```
SELECT locality, count(locality) as total_no_stores
FROM dim_store_details
GROUP BY locality
ORDER BY total_no_stores desc
limit 20;

```

- Scenario 3:
    - Which months produce the average highest cost of sales typically? 
    - Query the database to find which months typically have the most sales.
```
SELECT SUM(dim_products.product_price * product_quantity) as total_sales, dim_date_times.month
FROM orders_table
	LEFT JOIN dim_date_times on orders_table.date_uuid = dim_date_times.date_uuid
	LEFT JOIN dim_products on orders_table.product_code = dim_products.product_code
GROUP BY dim_date_times.month
ORDER BY total_sales desc;

```

- Scenario 4:
    - How many sales are coming from online?
    - The company is looking to increase its online sales. They want to know how many sales are happening online vs offline.
    - Calculate how many products were sold and the amount of sales made for online and offline purchases.

```
SELECT 
	COUNT(orders_table.product_quantity) as total_sales,
	SUM(orders_table.product_quantity) as product_quantity_count,
	CASE 
		WHEN dim_store_details.store_type = 'Web Portal' then 'Web'
		ELSE 'Offline'
	END AS location
FROM orders_table
	LEFT Join dim_store_details on orders_table.store_code = dim_store_details.store_code
GROUP BY location
ORDER BY product_quantity_count;
```
- Scenario 5:
    - What percentage of sale come through each type of store?
    - The sales team wants to know which of the different store types has generated the most revenue so they know where to focus.
    - Find out the total and percentage of sales coming from each of the different store types.
    
```
- SELECT 
	dim_store_details.store_type as store_details,
	SUM(orders_table.product_quantity * dim_products.product_price) as number_of_sales,
	
	SUM(orders_table.product_quantity * dim_products.product_price)	/ 
	(SELECT SUM(orders_table.product_quantity * dim_products.product_price) FROM orders_table
	 	LEFT JOIN dim_products on orders_table.product_code = dim_products.product_code)*100 as total_percent

FROM orders_table
	LEFT JOIN dim_store_details on orders_table.store_code = dim_store_details.store_code
	LEFT JOIN dim_products on orders_table.product_code = dim_products.product_code
GROUP BY store_details
ORDER BY number_of_sales desc;

```

- Scenario 6:
    - Which month in each year produced the highest cost of sales?
    - The companu stakeholders want assirances that the company has been doing well recently.
    - Find which months in which years have had the most sales historically.

```
SELECT SUM(staff_numbers) as total_staff_numbers, country_code
FROM dim_store_details
GROUP BY country_code
ORDER BY total_staff_numbers desc;
```

- Scenario 7:
    - Which German store type is selling the most?
    - The sales team is looking to expand their territory in germany.
    - Determine whuch type of store is generating the most sales in germany.
    
```
SELECT 
	COUNT(orders_table.user_uuid) as total_sales,
	dim_store_details.store_type,
	MAX(dim_store_details.country_code) as country_code
FROM orders_table
	LEFT JOIN dim_store_details on orders_table.store_code = dim_store_details.store_code
	LEFT JOIN dim_products on orders_table.product_code = dim_products.product_code
WHERE dim_store_details.country_code = 'DE'
GROUP BY dim_store_details.store_type;
```

- Scenario 8:
    - How quickly is the company making sales?
    - Sales would like to get an accurate metric for how quickly the compnay is making sales.
    - Determine the average time take between each sale grouped by year.
    
```
with time_table(hour, minutes, seconds, day, month, year, date_uuid) as (
	SELECT 
		EXTRACT(hour from CAST(timestamp as time)) as hour,
		EXTRACT(minute from CAST(timestamp as time)) as minutes,
		EXTRACT(second from CAST(timestamp as time)) as seconds,
		day as day,
		month as month,
		year as year,
		date_uuid
	FROM dim_date_times),
	
	timestamp_table(timestamp, date_uuid, year) as (
		SELECT MAKE_TIMESTAMP(CAST(time_table.year as int), CAST(time_table.month as int),
							  CAST(time_table.day as int), CAST(time_table.hour as int),	
							  CAST(time_table.minutes as int), CAST(time_table.seconds as float)) as order_timestamp,
			time_table.date_uuid as date_uuid, 
			time_table.year as year
		FROM time_table),
	
	time_stamp_diffs(year, time_diff) as (
		SELECT timestamp_table.year, timestamp_table.timestamp - LAG(timestamp_table.timestamp) OVER (ORDER BY timestamp_table.timestamp asc) as time_diff
		FROM orders_table
		JOIN timestamp_table ON orders_table.date_uuid = timestamp_table.date_uuid),

	year_time_diffs(year, average_time_diff) as (
		SELECT year, AVG(time_diff) as average_time_diff
		FROM time_stamp_diffs
		GROUP BY year
		ORDER BY average_time_diff desc)
		
SELECT 
	year, 
	CONCAT('hours: ', EXTRACT(HOUR FROM average_time_diff),
					'  minutes: ', EXTRACT(MINUTE FROM average_time_diff),
				   '  seconds: ', CAST(EXTRACT(SECOND FROM average_time_diff) as int),
				   '  milliseconds: ', CAST(EXTRACT(MILLISECOND FROM average_time_diff) as int))
FROM year_time_diffs;

```
