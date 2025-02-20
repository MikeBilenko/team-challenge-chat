docker compose build
docker compose up

#cqlsh
#use chat;
#CREATE TYPE IF NOT EXISTS reaction (user_ids LIST<TEXT>, reaction TEXT );
#CREATE TYPE IF NOT EXISTS message_pk (chat_id TEXT, created_at TIMESTAMP, id UUID);
#CREATE TABLE IF NOT EXISTS messages (chat_id TEXT, id UUID, user_id TEXT, text TEXT, images LIST<TEXT>, responds_to_message_pk FROZEN<message_pk>, reactions LIST<FROZEN<reaction>>, created_at TIMESTAMP, edited BOOLEAN, users_read SET<TEXT>, PRIMARY KEY (chat_id, created_at, id) ) WITH CLUSTERING ORDER BY (created_at DESC, id ASC);
#CREATE TABLE IF NOT EXISTS online_statuses (user_id TEXT, PRIMARY KEY (user_id) );
