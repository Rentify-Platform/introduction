| Node Label | Ý Nghĩa            | Ví Dụ                              |
| ---------- | ------------------ | ---------------------------------- |
| Document   | Văn bản pháp luật  | Luật Doanh nghiệp 2020, NĐ 01/2021 |
| Article    | Điều               | Điều 17 — Điều kiện thành lập      |
| Clause     | Khoản              | Khoản 1 Điều 17                    |
| Point      | Điểm               | Điểm a Khoản 1 Điều 17             |
| Concept    | Khái niệm pháp lý  | Vốn điều lệ, Cổ đông sáng lập      |
| Entity     | Chủ thể pháp lý    | Công ty TNHH, Doanh nghiệp tư nhân |
| Definition | Định nghĩa pháp lý | "Vốn điều lệ là..."                |
| Procedure  | Thủ tục hành chính | Thủ tục đăng ký doanh nghiệp       |

### Relation Types (Draft — cần thảo luận)

| Relation       | Ngữ Nghĩa             | Head → Tail                           |
| -------------- | --------------------- | ------------------------------------- |
| CONTAINS       | Cấu trúc phân cấp     | Document → Article → Clause → Point   |
| AMENDED_BY     | Bị sửa đổi bởi        | Article → Article                     |
| REPLACED_BY    | Bị thay thế hoàn toàn | Document → Document                   |
| IMPLEMENTED_BY | Được hướng dẫn bởi NĐ | Document(Law) → Document(Decree)      |
| GUIDED_BY      | Được hướng dẫn bởi TT | Document(Decree) → Document(Circular) |
| REFERENCES     | Viện dẫn              | Article → Article                     |
| DEFINES        | Định nghĩa khái niệm  | Article → Concept                     |
| REGULATES      | Điều chỉnh chủ thể    | Article → Entity                      |
| REQUIRES       | Yêu cầu điều kiện     | Entity → Concept (điều kiện)          |
| REPEALED_BY    | Bị hủy bỏ             | Document → Document                   |
