/**
 * Kesalahan yang pesannya ditulis untuk pemilik toko dan aman ditampilkan apa adanya di layar.
 * Kesalahan lain (database putus, bug) hanya dicatat di log server; layar menampilkan pesan umum.
 */
export class DapurError extends Error {}
