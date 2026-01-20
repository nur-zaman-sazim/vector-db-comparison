# Vector Database Benchmarking Guide

This guide will walk you through setting up and running benchmarks for all 5 vector databases: PGVector, ChromaDB, Milvus, Qdrant, and LanceDB.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Setup Instructions](#setup-instructions)
- [Running Benchmarks](#running-benchmarks)
- [Understanding Results](#understanding-results)
- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: v20 or higher
- **Docker & Docker Compose**: For running database containers


## Quick Start

```bash
# 1. Install dependencies
yarn install

# 2. Start all database containers
docker-compose -f docker-compose.benchmarks.yml up -d

# 3. Wait for databases to be ready (30-60 seconds)
docker-compose -f docker-compose.benchmarks.yml ps

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# 5. Start the application
yarn run start:dev

# 6. Run benchmarks (in another terminal)
curl -X POST http://localhost:3000/benchmarks/run-all \
  -H "Content-Type: application/json" \
  -d '{"vectorCount": 10000}'
```

## Setup Instructions

### 1. Database Setup with Docker Compose

The project includes a Docker Compose file that sets up all 5 vector databases. (Need to comment out the pg database in docker-compose.benchmarks.yml if you want to run it in the docker.)

#### Start All Databases

```bash
docker-compose -f docker-compose.benchmarks.yml up -d
```

This will start:
- **PGVector** (PostgreSQL with vector extension) on port `5433`
- **ChromaDB** on port `8000`
- **Qdrant** on ports `6333` (HTTP) and `6334` (gRPC)
- **Milvus** on port `19530` (with etcd and MinIO dependencies)
- **LanceDB** (embedded, no container needed)

#### Verify Containers are Running

```bash
docker-compose -f docker-compose.benchmarks.yml ps
```

All containers should show status as "Up" or "healthy".

#### View Container Logs

```bash
# View all logs
docker-compose -f docker-compose.benchmarks.yml logs -f

# View specific database logs
docker-compose -f docker-compose.benchmarks.yml logs -f pgvector
docker-compose -f docker-compose.benchmarks.yml logs -f chromadb
docker-compose -f docker-compose.benchmarks.yml logs -f milvus
docker-compose -f docker-compose.benchmarks.yml logs -f qdrant
```

#### Stop All Databases

```bash
docker-compose -f docker-compose.benchmarks.yml down
```

#### Stop and Remove All Data

```bash
docker-compose -f docker-compose.benchmarks.yml down -v
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```bash
# Application
NODE_ENV=development
PORT=3000

# PGVector Configuration
PGVECTOR_HOST=localhost
PGVECTOR_PORT=5433
PGVECTOR_DATABASE=benchmark_db
PGVECTOR_USER=benchmark_user
PGVECTOR_PASSWORD=benchmark_pass

# ChromaDB Configuration
CHROMADB_URL=http://localhost:8000

# Milvus Configuration
MILVUS_HOST=localhost
MILVUS_PORT=19530

# Qdrant Configuration
QDRANT_URL=http://localhost:6333
# QDRANT_API_KEY=your_api_key_here  # Optional

# LanceDB Configuration
LANCEDB_URI=./data/lancedb

# Benchmark Configuration
BENCHMARK_VECTOR_COUNT=100000
BENCHMARK_DIMENSIONS=1536
BENCHMARK_CONCURRENCY=10
```

### 3. Application Setup

```bash
# Install dependencies
yarn install

# Build the application
yarn run build

# Start the application
yarn run start:dev
```

The application will be available at `http://localhost:3000`.

## Running Benchmarks

### API Endpoints

#### 1. Run Benchmark for a Single Database

```bash
POST http://localhost:3000/benchmarks/run
```

**Request Body:**

```json
{
  "database": "pgvector",
  "vectorCount": 100000,
  "dimensions": 1536,
  "concurrency": 10,
  "duration": 60,
  "queryType": "similarity",
  "topK": 10,
  "recallTarget": 0.99
}
```

**Example with curl:**

```bash
curl -X POST http://localhost:3000/benchmarks/run \
  -H "Content-Type: application/json" \
  -d '{
    "database": "pgvector",
    "vectorCount": 10000,
    "dimensions": 1536,
    "queryType": "similarity",
    "topK": 10,
    "recallTarget": 0.99
  }'
```

**Available Database Options:**
- `pgvector`
- `chromadb`
- `milvus`
- `qdrant`
- `lancedb`

#### 2. Run Benchmarks for All Databases

```bash
POST http://localhost:3000/benchmarks/run-all
```

**Request Body:**

```json
{
  "vectorCount": 100000
}
```

**Example with curl:**

```bash
curl -X POST http://localhost:3000/benchmarks/run-all \
  -H "Content-Type: application/json" \
  -d '{"vectorCount": 100000}'
```

### Benchmark Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `database` | string | required | Database to benchmark (`pgvector`, `chromadb`, `milvus`, `qdrant`, `lancedb`) |
| `vectorCount` | number | 100000 | Number of vectors to insert and query |
| `dimensions` | number | 1536 | Vector dimensionality (OpenAI embedding size) |
| `concurrency` | number | 10 | Number of concurrent queries |
| `duration` | number | 60 | Test duration in seconds |
| `queryType` | string | "similarity" | Type of query (`similarity`, `filter`, `hybrid`) |
| `topK` | number | 10 | Number of nearest neighbors to retrieve |
| `recallTarget` | number | 0.99 | Target recall rate (0.0 - 1.0) |

### Progressive Benchmark Testing

Start with small datasets and progressively increase:

#### 1. Small Test (Quick validation)

```bash
curl -X POST http://localhost:3000/benchmarks/run-all \
  -H "Content-Type: application/json" \
  -d '{"vectorCount": 1000}'
```

⏱️ **Estimated time**: 1-2 minutes per database

#### 2. Medium Test (Development)

```bash
curl -X POST http://localhost:3000/benchmarks/run-all \
  -H "Content-Type: application/json" \
  -d '{"vectorCount": 10000}'
```

⏱️ **Estimated time**: 5-10 minutes per database

#### 3. Large Test (Performance analysis)

```bash
curl -X POST http://localhost:3000/benchmarks/run-all \
  -H "Content-Type: application/json" \
  -d '{"vectorCount": 100000}'
```

⏱️ **Estimated time**: 30-60 minutes per database

#### 4. Extra Large Test (Production simulation)

```bash
curl -X POST http://localhost:3000/benchmarks/run-all \
  -H "Content-Type: application/json" \
  -d '{"vectorCount": 1000000}'
```

⏱️ **Estimated time**: 2-4 hours per database

## Understanding Results

### Result Format

Benchmark results are saved in the `benchmark-results/` directory in both JSON and Markdown formats.

#### JSON Format

```json
{
  "database": "pgvector",
  "testName": "Latency Test",
  "timestamp": "2025-11-10T12:00:00.000Z",
  "config": {
    "database": "pgvector",
    "vectorCount": 100000,
    "dimensions": 1536,
    "concurrency": 10,
    "duration": 60,
    "queryType": "similarity",
    "topK": 10,
    "recallTarget": 0.99
  },
  "metrics": {
    "latencyP50": 12.5,
    "latencyP90": 25.3,
    "latencyP99": 45.7,
    "latencyMean": 15.2,
    "qps": 471.3,
    "recall": 0.99,
    "memoryUsedMB": 2048.5,
    "cpuUtilization": 65.3,
    "errors": 0,
    "totalQueries": 1000
  }
}
```

#### Markdown Format

Results are also exported as formatted Markdown tables for easy comparison:

```markdown
# Vector Database Benchmark Results

Generated: 2025-11-10T12:00:00.000Z

## pgvector

### Latency Test

| Vector Count | P50 (ms) | P99 (ms) | QPS | Recall | Memory (MB) |
|--------------|----------|----------|-----|--------|-------------|
| 100000 | 12.50 | 45.70 | 471.30 | 99.00% | 2048.50 |
```

### Key Metrics Explained

#### Latency Metrics

- **P50 (Median)**: 50% of queries complete in this time or less
  - *Good*: < 10ms
  - *Acceptable*: 10-50ms
  - *Poor*: > 50ms

- **P90**: 90% of queries complete in this time or less
  - *Good*: < 25ms
  - *Acceptable*: 25-100ms
  - *Poor*: > 100ms

- **P99**: 99% of queries complete in this time or less
  - *Good*: < 50ms
  - *Acceptable*: 50-200ms
  - *Poor*: > 200ms

- **Mean**: Average latency across all queries

#### Throughput Metrics

- **QPS (Queries Per Second)**: Number of queries processed per second
  - *Excellent*: > 500 QPS
  - *Good*: 200-500 QPS
  - *Acceptable*: 100-200 QPS
  - *Poor*: < 100 QPS

#### Quality Metrics

- **Recall**: Percentage of true nearest neighbors found
  - *Excellent*: > 99%
  - *Good*: 95-99%
  - *Acceptable*: 90-95%
  - *Poor*: < 90%

#### Resource Metrics

- **Memory Used (MB)**: Peak memory consumption during test
- **CPU Utilization**: Average CPU usage percentage
- **Errors**: Number of failed queries (should be 0)

### Comparing Results

When comparing databases, consider:

1. **Latency vs Throughput Tradeoff**: Lower latency may mean lower throughput
2. **Recall vs Speed Tradeoff**: Higher recall may require more computation
3. **Memory Usage**: Important for cost optimization
4. **Scalability**: How metrics change with vector count

## Advanced Configuration

### Testing Different Vector Dimensions

```bash
# Test with smaller embeddings (Sentence Transformers)
curl -X POST http://localhost:3000/benchmarks/run \
  -H "Content-Type: application/json" \
  -d '{
    "database": "pgvector",
    "vectorCount": 10000,
    "dimensions": 768,
    "topK": 10
  }'

# Test with larger embeddings (Custom models)
curl -X POST http://localhost:3000/benchmarks/run \
  -H "Content-Type: application/json" \
  -d '{
    "database": "pgvector",
    "vectorCount": 10000,
    "dimensions": 3072,
    "topK": 10
  }'
```

### Testing Different Top-K Values

```bash
# Retrieve more neighbors
curl -X POST http://localhost:3000/benchmarks/run \
  -H "Content-Type: application/json" \
  -d '{
    "database": "qdrant",
    "vectorCount": 10000,
    "topK": 100
  }'
```

### Testing with Filtered Search

```bash
curl -X POST http://localhost:3000/benchmarks/run \
  -H "Content-Type: application/json" \
  -d '{
    "database": "milvus",
    "vectorCount": 10000,
    "queryType": "filter"
  }'
```

### Testing Concurrent Load

```bash
# Test with high concurrency
curl -X POST http://localhost:3000/benchmarks/run \
  -H "Content-Type: application/json" \
  -d '{
    "database": "qdrant",
    "vectorCount": 10000,
    "concurrency": 100
  }'
```

## Database-Specific Optimizations

### PGVector

#### Index Configuration

The implementation supports both HNSW and IVFFlat indexes. To switch:

```typescript
// In pgvector.service.ts
await this.createVectorIndex('hnsw'); // or 'ivfflat'
```

#### PostgreSQL Tuning

Edit `docker-compose.benchmarks.yml`:

```yaml
pgvector:
  command:
    - postgres
    - -c
    - shared_buffers=4GB        # Increase for more RAM
    - -c
    - effective_cache_size=12GB
    - -c
    - maintenance_work_mem=2GB
    - -c
    - max_parallel_workers=8
```

### ChromaDB

#### HNSW Parameters

Adjust in `chromadb.service.ts`:

```typescript
metadata: {
  'hnsw:space': 'cosine',
  'hnsw:construction_ef': 200,  // Higher = better recall, slower build
  'hnsw:search_ef': 200,        // Higher = better recall, slower search
  'hnsw:M': 32,                 // Higher = better recall, more memory
}
```

### Milvus

#### Index Configuration

Modify in `milvus.service.ts`:

```typescript
await this.client.createIndex({
  collection_name: this.currentCollection,
  field_name: 'embedding',
  index_type: IndexType.HNSW,
  metric_type: MetricType.COSINE,
  params: {
    M: 32,              // Increase for better recall
    efConstruction: 400, // Increase for better recall
  },
});
```

### Qdrant

#### Collection Configuration

Adjust in `qdrant.service.ts`:

```typescript
await this.client.createCollection(name, {
  vectors: {
    size: dimensions,
    distance: 'Cosine',
    on_disk: false,  // Set to true for larger datasets
  },
  hnsw_config: {
    m: 32,              // Increase for better recall
    ef_construct: 200,  // Increase for better recall
    full_scan_threshold: 20000,
  },
});
```

### LanceDB

LanceDB automatically manages indexing. For manual control, you can configure:

```typescript
// Note: LanceDB's index creation is currently automatic
// For manual configuration, refer to LanceDB documentation
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failures

**Symptom**: "Connection refused" or timeout errors

**Solution**:
```bash
# Check if containers are running
docker-compose -f docker-compose.benchmarks.yml ps

# Restart specific database
docker-compose -f docker-compose.benchmarks.yml restart pgvector

# Check logs for errors
docker-compose -f docker-compose.benchmarks.yml logs pgvector
```

#### 2. Out of Memory Errors

**Symptom**: Application crashes or "JavaScript heap out of memory"

**Solution**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=8192" yarn run start:dev

# Or reduce vectorCount in benchmarks
```

#### 3. Slow Performance

**Symptom**: Benchmarks taking extremely long

**Solution**:
- Start with smaller datasets (1K-10K vectors)
- Check Docker container resources
- Ensure SSD storage is being used
- Close other resource-intensive applications

#### 4. Milvus Connection Issues

**Symptom**: "Milvus connection failed"

**Solution**:
```bash
# Milvus requires etcd and MinIO to be ready first
docker-compose -f docker-compose.benchmarks.yml restart etcd minio
sleep 10
docker-compose -f docker-compose.benchmarks.yml restart milvus
```

#### 5. Port Conflicts

**Symptom**: "Port already in use"

**Solution**:
```bash
# Check what's using the port
sudo lsof -i :5433  # or other port

# Stop conflicting service or change port in docker-compose.benchmarks.yml
```

### Debug Mode

Enable detailed logging:

```bash
# Set log level in .env
LOG_LEVEL=debug

# Restart application
yarn run start:dev
```

### Health Checks

Verify database connectivity:

```bash
# PGVector
docker exec benchmark_pgvector psql -U benchmark_user -d benchmark_db -c "SELECT version();"

# ChromaDB
curl http://localhost:8000/api/v1/heartbeat

# Qdrant
curl http://localhost:6333/

# Milvus
docker exec benchmark_milvus milvus-health-check
```




###  Data Persistence

Results are automatically saved to `benchmark-results/`:

```bash
# View results
ls -lh benchmark-results/

# Archive results
tar -czf results-$(date +%Y%m%d).tar.gz benchmark-results/
```


