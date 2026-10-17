import os
import math
from PIL import Image, ImageDraw, ImageFont

def generate_full_page_academic_diagram():
    # Canvas dimensions optimized to fill the FULL printable area of an A4 page in Microsoft Word:
    # Width: 1800 px, Height: 2350 px (Aspect ratio: 1 : 1.305)
    # When inserted with standard Word margins (6.5 in text width), height fills ~8.5 in,
    # filling the ENTIRE page from left margin to right margin without spilling over!
    w = 1800
    h = 2350

    img = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Load Windows standard fonts with high-legibility sizes
    font_dir = "C:/Windows/Fonts"
    try:
        f_main_title = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 34)
        f_main_sub = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 20)
        f_col_hdr = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 22)
        f_box_title = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 20)
        f_box_sub = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 16.5)
        f_diamond = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 17)
        f_edge = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 16)
        f_term = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 18)
        f_leg_hdr = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 20)
        f_leg_title = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 16)
        f_leg_desc = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 14.5)
        f_footer = ImageFont.truetype(os.path.join(font_dir, "segoeuii.ttf"), 15)
    except Exception:
        f_main_title = ImageFont.load_default()
        f_main_sub = f_col_hdr = f_box_title = f_box_sub = f_diamond = f_edge = f_term = f_leg_hdr = f_leg_title = f_leg_desc = f_footer = f_main_title

    # Palette
    c_slate_dark = (15, 23, 42)      # #0f172a
    c_slate_mid = (71, 85, 105)      # #475569
    c_border = (203, 213, 225)       # #cbd5e1
    c_arrow = (51, 65, 85)           # #334155

    # Title header banner
    draw.text((w // 2, 45), "SIKA CUISINE WEB ORDERING & DELIVERY PLATFORM", fill=c_slate_dark, font=f_main_title, anchor="mt")
    draw.text((w // 2, 90), "Figure 1.1: Conceptual Framework & Server-Authoritative Architecture", fill=c_slate_mid, font=f_main_sub, anchor="mt")
    draw.line([(60, 128), (w - 60, 128)], fill=(203, 213, 225), width=2)

    # 3 WIDE COLUMNS (Swimlanes spanning full 1800px width)
    # Col 1: Customer (Client Layer)
    c1_x1, c1_x2 = 60, 580
    # Col 2: Server & Financial Core
    c2_x1, c2_x2 = 640, 1160
    # Col 3: Kitchen & Delivery Fulfilment
    c3_x1, c3_x2 = 1220, 1740

    top_y = 150
    col_h = 1620

    def draw_swimlane(x1, x2, title, bg_col, hdr_col, border_col):
        draw.rounded_rectangle([x1, top_y, x2, top_y + col_h], radius=14, fill=bg_col, outline=border_col, width=2)
        # Header banner inside swimlane
        draw.rounded_rectangle([x1, top_y, x2, top_y + 54], radius=14, fill=hdr_col)
        draw.rectangle([x1, top_y + 36, x2, top_y + 54], fill=hdr_col)
        draw.text(((x1 + x2) // 2, top_y + 14), title, fill=(255, 255, 255), font=f_col_hdr, anchor="mt")

    draw_swimlane(c1_x1, c1_x2, "1. CLIENT LAYER (CUSTOMER)", (248, 250, 252), (30, 58, 138), (191, 219, 254))
    draw_swimlane(c2_x1, c2_x2, "2. SERVER & FINANCIAL CORE", (239, 246, 255), (29, 78, 216), (147, 197, 253))
    draw_swimlane(c3_x1, c3_x2, "3. KITCHEN & FULFILMENT", (240, 253, 244), (21, 128, 61), (134, 239, 172))

    # Helper: draw process box with exact geometry
    def box(cx, cy, bw, bh, title, sub_lines=[], fill=(255, 255, 255), border=(148, 163, 184), radius=10):
        x1 = cx - bw // 2
        y1 = cy - bh // 2
        x2 = cx + bw // 2
        y2 = cy + bh // 2
        # Shadow
        draw.rounded_rectangle([x1 + 3, y1 + 3, x2 + 3, y2 + 3], radius=radius, fill=(226, 232, 240, 180))
        draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill, outline=border, width=2)
        
        # Text layout
        total_lines = 1 + len(sub_lines)
        start_y = cy - (total_lines * 22) // 2
        draw.text((cx, start_y), title, fill=c_slate_dark, font=f_box_title, anchor="mt")
        for i, sl in enumerate(sub_lines):
            draw.text((cx, start_y + 26 + i * 22), sl, fill=c_slate_mid, font=f_box_sub, anchor="mt")
        return {"x1": x1, "y1": y1, "x2": x2, "y2": y2, "cx": cx, "cy": cy, "bw": bw, "bh": bh}

    # Helper: draw decision diamond with exact geometry
    def diamond(cx, cy, dw, dh, title_lines, fill=(255, 251, 235), border=(217, 119, 6)):
        pts = [(cx, cy - dh // 2), (cx + dw // 2, cy), (cx, cy + dh // 2), (cx - dw // 2, cy)]
        # Shadow
        s_pts = [(x + 3, y + 3) for x, y in pts]
        draw.polygon(s_pts, fill=(226, 232, 240, 180))
        draw.polygon(pts, fill=fill, outline=border)
        draw.line([pts[0], pts[1], pts[2], pts[3], pts[0]], fill=border, width=2)
        
        # Text centered
        total_h = len(title_lines) * 20
        start_y = cy - total_h // 2
        for i, l in enumerate(title_lines):
            draw.text((cx, start_y + i * 20), l, fill=(120, 53, 15), font=f_diamond, anchor="mt")
        return {"cx": cx, "cy": cy, "dw": dw, "dh": dh, "pts": pts}

    # Helper: draw start / end terminal
    def terminal(cx, cy, tw, th, text, fill=(241, 245, 249), border=(71, 85, 105)):
        x1 = cx - tw // 2
        y1 = cy - th // 2
        x2 = cx + tw // 2
        y2 = cy + th // 2
        draw.rounded_rectangle([x1 + 3, y1 + 3, x2 + 3, y2 + 3], radius=th // 2, fill=(226, 232, 240, 180))
        draw.rounded_rectangle([x1, y1, x2, y2], radius=th // 2, fill=fill, outline=border, width=2)
        draw.text((cx, cy - 10), text, fill=c_slate_dark, font=f_term, anchor="mt")
        return {"x1": x1, "y1": y1, "x2": x2, "y2": y2, "cx": cx, "cy": cy, "tw": tw, "th": th}

    # Helper: straight arrow touching exact coordinate
    def arrow(p1, p2, label=None, label_side="right", color=c_arrow):
        x1, y1 = p1
        x2, y2 = p2
        draw.line([(x1, y1), (x2, y2)], fill=color, width=3)

        angle = math.atan2(y2 - y1, x2 - x1)
        arr_len = 14
        arr_ang = math.pi / 6
        ax1 = x2 - arr_len * math.cos(angle - arr_ang)
        ay1 = y2 - arr_len * math.sin(angle - arr_ang)
        ax2 = x2 - arr_len * math.cos(angle + arr_ang)
        ay2 = y2 - arr_len * math.sin(angle + arr_ang)
        draw.polygon([(x2, y2), (ax1, ay1), (ax2, ay2)], fill=color)

        if label:
            mx = (x1 + x2) // 2
            my = (y1 + y2) // 2
            bbox = f_edge.getbbox(label)
            lw = bbox[2] - bbox[0]
            lh = bbox[3] - bbox[1]
            bx = mx + 12 if label_side == "right" else mx - lw - 12
            draw.rounded_rectangle([bx - 6, my - lh // 2 - 4, bx + lw + 6, my + lh // 2 + 4], radius=5, fill=(255, 255, 255, 240), outline=(203, 213, 225), width=1)
            draw.text((bx, my - lh // 2), label, fill=color, font=f_edge, anchor="lt")

    # Helper: elbow connector touching exact destination
    def elbow_arrow(p1, corner, p2, label=None, label_pos=None, color=c_arrow):
        draw.line([p1, corner], fill=color, width=3)
        draw.line([corner, p2], fill=color, width=3)
        
        x1, y1 = corner
        x2, y2 = p2
        angle = math.atan2(y2 - y1, x2 - x1)
        arr_len = 14
        arr_ang = math.pi / 6
        ax1 = x2 - arr_len * math.cos(angle - arr_ang)
        ay1 = y2 - arr_len * math.sin(angle - arr_ang)
        ax2 = x2 - arr_len * math.cos(angle + arr_ang)
        ay2 = y2 - arr_len * math.sin(angle + arr_ang)
        draw.polygon([(x2, y2), (ax1, ay1), (ax2, ay2)], fill=color)

        if label and label_pos:
            lx, ly = label_pos
            bbox = f_edge.getbbox(label)
            lw = bbox[2] - bbox[0]
            lh = bbox[3] - bbox[1]
            draw.rounded_rectangle([lx - 6, ly - 4, lx + lw + 6, ly + lh + 4], radius=5, fill=(255, 255, 255, 240), outline=(203, 213, 225), width=1)
            draw.text((lx, ly), label, fill=color, font=f_edge, anchor="lt")

    # =========================================================
    # COLUMN 1: CLIENT LAYER (Customer Browser)
    # =========================================================
    c1_cx = (c1_x1 + c1_x2) // 2
    b_w1 = 440

    n_start = terminal(c1_cx, 250, 400, 56, "Start: Customer Visits Platform")
    n_browse = box(c1_cx, 390, b_w1, 85, "Browse Categorized Menu", ["Authentic Ghanaian dishes, soups, sides"])
    n_custom = box(c1_cx, 540, b_w1, 85, "Customize Meal & Options", ["Select proteins, starches, spice levels"])
    n_zone = box(c1_cx, 690, b_w1, 85, "Select Sunyani Locality / Pickup", ["Fiapre, Berlin Top, Penkwase, etc."])
    n_submit = box(c1_cx, 840, b_w1, 85, "Submit Order Checkout", ["Transmits Item IDs & Delivery Zone ID"], fill=(238, 242, 255), border=(99, 102, 241))

    n_c1_note = box(c1_cx, 1220, b_w1, 150, "Client Security Protocol", [
        "* Client prices are strictly untrusted",
        "* JavaScript totals discarded at server",
        "* Strict parameter sanitization & typing",
        "* CSRF & XSS protection active"
    ], fill=(255, 255, 255), border=(147, 197, 253))

    arrow((c1_cx, n_start["y2"]), (c1_cx, n_browse["y1"]))
    arrow((c1_cx, n_browse["y2"]), (c1_cx, n_custom["y1"]))
    arrow((c1_cx, n_custom["y2"]), (c1_cx, n_zone["y1"]))
    arrow((c1_cx, n_zone["y2"]), (c1_cx, n_submit["y1"]))

    # =========================================================
    # COLUMN 2: SERVER & FINANCIAL CORE (Next.js & Paystack)
    # =========================================================
    c2_cx = (c2_x1 + c2_x2) // 2
    b_w2 = 450

    n_srv_auth = box(c2_cx, 260, b_w2, 95, "Enforce Server Authority", ["100% Discard client-submitted totals", "Query authoritative PostgreSQL prices"], fill=(254, 242, 242), border=(239, 68, 68))
    n_pesewas = box(c2_cx, 420, b_w2, 95, "Integer Pesewas Standard Calculation", ["1 GHS = 100 pesewas (Zero drift)", "Write immutable snapshot to OrderItem"], fill=(236, 253, 245), border=(16, 185, 129))
    n_d_pay = diamond(c2_cx, 580, 270, 105, ["Selected", "Payment Channel?"])

    n_momo = box(c2_cx - 110, 750, 220, 85, "Paystack Gateway", ["MoMo / Card", "API Initialize"])
    n_cash = box(c2_cx + 120, 750, 190, 85, "Cash Handover", ["Flagged as", "PENDING_CASH"])

    n_d_hmac = diamond(c2_cx - 110, 920, 230, 105, ["HMAC SHA512", "Signature Valid?"])
    
    n_sec_alert = box(c2_cx - 110, 1100, 210, 80, "Reject & Terminate", ["Log security alert", "Abort order creation"], fill=(254, 242, 242), border=(220, 38, 38))
    n_paid = box(c2_cx - 110, 1250, 220, 80, "Update: PAID", ["Confirmed in DB ledger", "Notify kitchen board"], fill=(236, 253, 245), border=(16, 185, 129))

    arrow((c2_cx, n_srv_auth["y2"]), (c2_cx, n_pesewas["y1"]))
    arrow((c2_cx, n_pesewas["y2"]), (c2_cx, n_d_pay["cy"] - n_d_pay["dh"] // 2))

    elbow_arrow((c2_cx - n_d_pay["dw"] // 2, n_d_pay["cy"]), (c2_cx - 110, n_d_pay["cy"]), (c2_cx - 110, n_momo["y1"]), label="Online", label_pos=(c2_cx - 190, n_d_pay["cy"] + 22))
    elbow_arrow((c2_cx + n_d_pay["dw"] // 2, n_d_pay["cy"]), (c2_cx + 120, n_d_pay["cy"]), (c2_cx + 120, n_cash["y1"]), label="Cash", label_pos=(c2_cx + 130, n_d_pay["cy"] + 22))

    arrow((c2_cx - 110, n_momo["y2"]), (c2_cx - 110, n_d_hmac["cy"] - n_d_hmac["dh"] // 2))

    arrow((c2_cx - 110, n_d_hmac["cy"] + n_d_hmac["dh"] // 2), (c2_cx - 110, n_sec_alert["y1"]), label="Invalid", label_side="right", color=(220, 38, 38))
    
    elbow_arrow((c2_cx - 110 - n_d_hmac["dw"] // 2, n_d_hmac["cy"]), (c2_x1 + 30, n_d_hmac["cy"]), (c2_x1 + 30, n_paid["cy"]))
    arrow((c2_x1 + 30, n_paid["cy"]), (n_paid["x1"], n_paid["cy"]), label="Valid", label_side="right", color=(16, 185, 129))

    # =========================================================
    # CROSS-COLUMN CONNECTOR: Col 1 -> Col 2
    # =========================================================
    elbow_arrow((n_submit["x2"], n_submit["cy"]), (c2_x1 - 30, n_submit["cy"]), (c2_x1 - 30, 260))
    arrow((c2_x1 - 30, 260), (n_srv_auth["x1"], 260), label="POST /api/actions/order", label_side="right", color=(37, 99, 235))

    # =========================================================
    # COLUMN 3: KITCHEN & FULFILMENT (Admin Dashboard)
    # =========================================================
    c3_cx = (c3_x1 + c3_x2) // 2
    b_w3 = 440

    n_k_queue = box(c3_cx, 260, b_w3, 95, "Live Kitchen Display Board", ["Incoming order queued in real-time", "Displays dish specifics & spice levels"])
    n_d_stock = diamond(c3_cx, 420, 270, 105, ["Kitchen Capacity", "& Stock Available?"])
    
    n_k_reject = box(c3_cx - 105, 590, 210, 85, "Order REJECTED", ["Reason recorded", "Auto-refund issued"], fill=(254, 242, 242), border=(220, 38, 38))
    n_k_prep = box(c3_cx + 110, 590, 210, 85, "PREPARING MEAL", ["Chefs cook dish", "Tamper-proof seal"], fill=(236, 253, 245), border=(16, 185, 129))

    n_d_fulfil = diamond(c3_cx + 110, 770, 240, 95, ["Fulfilment", "Channel?"])

    n_deliv = box(c3_cx - 105, 950, 210, 90, "OUT_FOR_DELIVERY", ["Courier dispatched", "to Sunyani locality"])
    n_pickup = box(c3_cx + 115, 950, 210, 90, "READY_COLLECTION", ["Staged at counter", "Customer notified"])

    n_handover = box(c3_cx, 1130, b_w3, 85, "Customer Handover & Verification", ["Customer receives hot meal in Sunyani"])
    n_term_success = terminal(c3_cx, 1270, 380, 56, "COMPLETED (Ledger Settled)", fill=(236, 253, 245), border=(16, 185, 129))

    n_term_cancel = terminal(c3_cx - 105, 740, 200, 48, "Cancelled", fill=(254, 242, 242), border=(220, 38, 38))

    arrow((c3_cx, n_k_queue["y2"]), (c3_cx, n_d_stock["cy"] - n_d_stock["dh"] // 2))

    elbow_arrow((c3_cx - n_d_stock["dw"] // 2, n_d_stock["cy"]), (c3_cx - 105, n_d_stock["cy"]), (c3_cx - 105, n_k_reject["y1"]), label="No", label_pos=(c3_cx - 180, n_d_stock["cy"] + 22), color=(220, 38, 38))
    elbow_arrow((c3_cx + n_d_stock["dw"] // 2, n_d_stock["cy"]), (c3_cx + 110, n_d_stock["cy"]), (c3_cx + 110, n_k_prep["y1"]), label="Yes", label_pos=(c3_cx + 125, n_d_stock["cy"] + 22), color=(16, 185, 129))

    arrow((c3_cx - 105, n_k_reject["y2"]), (c3_cx - 105, n_term_cancel["y1"]))
    arrow((c3_cx + 110, n_k_prep["y2"]), (c3_cx + 110, n_d_fulfil["cy"] - n_d_fulfil["dh"] // 2))

    elbow_arrow((c3_cx + 110 - n_d_fulfil["dw"] // 2, n_d_fulfil["cy"]), (c3_cx - 105, n_d_fulfil["cy"]), (c3_cx - 105, n_deliv["y1"]), label="Delivery", label_pos=(c3_cx - 65, n_d_fulfil["cy"] + 22))
    arrow((c3_cx + 110, n_d_fulfil["cy"] + n_d_fulfil["dh"] // 2), (c3_cx + 115, n_pickup["y1"]), label="Takeaway", label_side="right")

    elbow_arrow((c3_cx - 105, n_deliv["y2"]), (c3_cx - 105, 1060), (c3_cx - 100, n_handover["y1"]))
    elbow_arrow((c3_cx + 115, n_pickup["y2"]), (c3_cx + 115, 1060), (c3_cx + 100, n_handover["y1"]))

    arrow((c3_cx, n_handover["y2"]), (c3_cx, n_term_success["y1"]))

    # =========================================================
    # CROSS-COLUMN CONNECTOR: Col 2 -> Col 3
    # =========================================================
    elbow_arrow((n_paid["x2"], n_paid["cy"]), (c2_x2 + 30, n_paid["cy"]), (c2_x2 + 30, 260))
    arrow((c2_x2 + 30, 260), (n_k_queue["x1"], 260), label="Cleared Order", label_side="right", color=(16, 185, 129))

    elbow_arrow((n_cash["x2"], n_cash["cy"]), (c2_x2 + 30, n_cash["cy"]), (c2_x2 + 30, 260))

    # =========================================================
    # FULL-WIDTH ARCHITECTURE HIGHLIGHTS PANEL (Spans full page)
    # =========================================================
    leg_y = 1800
    leg_w = w - 120
    draw.rounded_rectangle([60, leg_y, w - 60, leg_y + 480], radius=14, fill=(255, 255, 255), outline=c_border, width=2)
    draw.text((90, leg_y + 20), "COMPUTATIONAL & ARCHITECTURAL HIGHLIGHTS (ACADEMIC SPECIFICATION)", fill=c_slate_dark, font=f_leg_hdr)

    summary_points = [
        ("Zero Floating-Point Financial Precision:", "All prices, delivery fees, and subtotals computed strictly as integer pesewas (1 GHS = 100 pesewas) to eliminate accumulated rounding drift."),
        ("Server-Authoritative Pricing Model:", "Client-submitted monetary amounts are strictly discarded at checkout. The server re-evaluates all values from PostgreSQL database snapshots."),
        ("Cryptographically Verified Webhooks:", "Paystack payment signals verified using HMAC SHA512 signatures with timing-safe string comparison, preventing payment spoofing."),
        ("Sunyani Locality Delivery Matrix:", "Pre-computed delivery tariffs for Sunyani Central, Fiapre (UENR/CUG), Berlin Top, Penkwase, Abesim, New Dormaa, and Airport Residential."),
        ("Strict Fulfilment State Machine:", "Rigid state transitions (PENDING_CONFIRMATION -> CONFIRMED -> PREPARING -> OUT_FOR_DELIVERY -> COMPLETED) preventing illegal jumps.")
    ]

    for idx, (label_txt, desc_txt) in enumerate(summary_points):
        row_y = leg_y + 60 + idx * 80
        draw.rounded_rectangle([90, row_y, 490, row_y + 32], radius=6, fill=(241, 245, 249), outline=(203, 213, 225), width=1)
        draw.text((100, row_y + 6), label_txt, fill=(30, 58, 138), font=f_leg_title)
        draw.text((95, row_y + 38), desc_txt, fill=c_slate_mid, font=f_leg_desc)

    draw.text((w // 2, h - 35), "* Catholic University of Ghana, Faculty of Computing, Engineering & Mathematical Sciences (CEMS)", fill=c_slate_mid, font=f_footer, anchor="mt")

    out_dir = "docs/figures"
    os.makedirs(out_dir, exist_ok=True)
    png_path = os.path.join(out_dir, "figure_1_1_conceptual_framework.png")
    
    rgb_img = Image.new("RGB", img.size, (255, 255, 255))
    rgb_img.paste(img, mask=img.split()[3])
    rgb_img.save(png_path, "PNG", dpi=(300, 300), optimize=True)
    print(f"Generated FULL-WIDTH academic diagram at: {png_path} ({w}x{h})")

if __name__ == "__main__":
    generate_full_page_academic_diagram()
