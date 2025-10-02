-- Answering business scenario questions in PostgreSQL


-- How many stores does the business have and in wich countires?
-- The Operations team would like to know which countries we currently operate in and which country now has the most stores.

SELECT country_code, COUNT(country_code) as total_no_stores
FROM dim_store_details
GROUP BY country_code
ORDER BY total_no_stores desc;

-- Which locations currently have the most stores?
-- The business stakeholders would like to know which locations currently have the most stores.

SELECT locality, count(locality) as total_no_stores
FROM dim_store_details
GROUP BY locality
ORDER BY total_no_stores desc
limit 20;


-- Which months produce the average highest cost of sales typically? 
-- Query the database to find which months typically have the most sales.

SELECT SUM(dim_products.product_price * product_quantity) as total_sales, dim_date_times.month
FROM orders_table
	LEFT JOIN dim_date_times on orders_table.date_uuid = dim_date_times.date_uuid
	LEFT JOIN dim_products on orders_table.product_code = dim_products.product_code
GROUP BY dim_date_times.month
ORDER BY total_sales desc;

-- How many sales are coming from online?
-- The company is looking to increase its online sales. They want to know how many sales are happening online vs offline.
-- Calculate how many products were sold and the amount of sales made for online and offline purchases.

SELECT store_type
FROM dim_store_details
WHERE store_type = 'Web Portal';


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

-- What percentage of sale come through each type of store?
-- The sales team wants to know which of the different store types has generated the most revenue so they know where to focus.
-- Find out the total and percentage of sales coming from each of the different store types.

SELECT 
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


-- Which month in each year produced the highest cost of sales?
-- The companu stakeholders want assirances that the company has been doing well recently.
-- Find which months in which years have had the most sales historically.

SELECT SUM(staff_numbers) as total_staff_numbers, country_code
FROM dim_store_details
GROUP BY country_code
ORDER BY total_staff_numbers desc;


-- Which German store type is selling the most?
-- The sales team is looking to expand their territory in germany.
-- Determine whuch type of store is generating the most sales in germany.

SELECT 
	COUNT(orders_table.user_uuid) as total_sales,
	dim_store_details.store_type,
	MAX(dim_store_details.country_code) as country_code
FROM orders_table
	LEFT JOIN dim_store_details on orders_table.store_code = dim_store_details.store_code
	LEFT JOIN dim_products on orders_table.product_code = dim_products.product_code
WHERE dim_store_details.country_code = 'DE'
GROUP BY dim_store_details.store_type;

-- How quickly is the company making sales?
-- Sales would like to get an accurate metric for how quickly the compnay is making sales.
-- Determine the average time take between each sale grouped by year.

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
	



	