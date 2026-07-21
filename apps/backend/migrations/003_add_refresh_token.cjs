module.exports.up = async function up(knex) {
  const hasUsers = await knex.schema.hasTable('users');
  if (hasUsers) {
    const hasCol = await knex.schema.hasColumn('users', 'refresh_token');
    if (!hasCol) {
      await knex.schema.table('users', (table) => {
        table.string('refresh_token').index();
      });
    }
  }
};

module.exports.down = async function down(knex) {
  const hasUsers = await knex.schema.hasTable('users');
  if (hasUsers) {
    const hasCol = await knex.schema.hasColumn('users', 'refresh_token');
    if (hasCol) {
      await knex.schema.table('users', (table) => {
        table.dropColumn('refresh_token');
      });
    }
  }
};
