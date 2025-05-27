# Sampling Configuration Examples

## Enhanced Sampling Features

The sampling configuration now supports powerful column and row filtering options with the following enhancements:

### Column Selection Features
- **Data type awareness**: Visual indicators for numeric, text, date/time, and boolean columns
- **Advanced filtering**: Filter columns by type, search by name, or show only columns with null values
- **Sample values display**: View sample values for each column
- **Null statistics**: See null percentages for each column
- **Column ordering**: Set sort order (ascending/descending) for any column
- **Multiple views**: Organize columns by "All", "By Type", or "By Null percentage"

### Row Filtering Features
- **Dynamic operators**: Operators change based on column data type
  - Text: =, !=, LIKE, ILIKE, IN, NOT IN, IS NULL, IS NOT NULL
  - Numeric: =, !=, >, <, >=, <=, IN, NOT IN, IS NULL, IS NOT NULL
  - Date/Time: =, !=, >, <, >=, <=, IS NULL, IS NOT NULL
  - Boolean: =, !=, IS NULL, IS NOT NULL
- **Smart value input**: Context-aware placeholders and validation
- **Sample value suggestions**: Click on sample values to use them
- **Multiple conditions**: Support for AND/OR logic between conditions

## Example Requests

### 1. Stratified Sampling
```json
{
  "method": "stratified",
  "parameters": {
    "strata_columns": ["type", "rating"],
    "sample_size": 1000,
    "min_per_stratum": 10,
    "seed": 123
  },
  "output_name": "stratified_by_type_rating",
  "filters": {
    "conditions": [
      {
        "column": "release_year",
        "operator": ">=",
        "value": 2020
      }
    ],
    "logic": "AND"
  },
  "selection": {
    "columns": ["show_id", "type", "title", "rating", "release_year"],
    "order_by": "release_year",
    "order_desc": true
  }
}
```

### 2. Random Sampling with Filters
```json
{
  "method": "random",
  "parameters": {
    "sample_size": 500,
    "seed": 42
  },
  "output_name": "recent_movies_sample",
  "filters": {
    "conditions": [
      {
        "column": "type",
        "operator": "=",
        "value": "Movie"
      },
      {
        "column": "release_year",
        "operator": ">",
        "value": 2018
      },
      {
        "column": "director",
        "operator": "IS NOT NULL",
        "value": null
      }
    ],
    "logic": "AND"
  },
  "selection": {
    "columns": ["title", "director", "cast", "release_year", "rating"],
    "order_by": "title",
    "order_desc": false
  }
}
```

### 3. Systematic Sampling
```json
{
  "method": "systematic",
  "parameters": {
    "interval": 10,
    "start": 5
  },
  "output_name": "every_10th_row",
  "selection": {
    "columns": null,  // Include all columns
    "order_by": "show_id",
    "order_desc": false
  }
}
```

### 4. Cluster Sampling
```json
{
  "method": "cluster",
  "parameters": {
    "cluster_column": "country",
    "num_clusters": 5,
    "sample_within_clusters": 20
  },
  "output_name": "country_clusters_sample",
  "filters": {
    "conditions": [
      {
        "column": "listed_in",
        "operator": "LIKE",
        "value": "%Drama%"
      }
    ],
    "logic": "AND"
  }
}
```

### 5. Custom SQL Sampling
```json
{
  "method": "custom",
  "parameters": {
    "query": "SELECT * FROM dataset WHERE rating IN ('PG', 'PG-13') AND release_year BETWEEN 2015 AND 2020 ORDER BY RANDOM() LIMIT 100"
  },
  "output_name": "custom_family_movies"
}
```

## UI Workflow

1. **Select Dataset & Version**: Choose your data source
2. **Choose Sampling Method**: Pick from random, stratified, systematic, cluster, or custom
3. **Configure Parameters**: Set method-specific parameters in the Parameters tab
4. **Select Columns** (Optional): Choose which columns to include and set ordering
5. **Add Filters** (Optional): Create row filtering conditions
6. **Name Output**: Give your sample a descriptive name
7. **Execute**: Run the sampling operation

The enhanced UI provides a tabbed interface for better organization and allows you to configure all aspects of your sampling operation in one place.