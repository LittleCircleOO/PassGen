package main

import (
	"strings"
	"testing"
)

func TestGenerateRandom(t *testing.T) {
	app := NewApp()
	g, err := app.GenerateRandom(20, true, false)
	if err != nil {
		t.Fatalf("GenerateRandom: %v", err)
	}
	if len(g.Password) != 20 {
		t.Errorf("want length 20, got %d (%q)", len(g.Password), g.Password)
	}
	if g.Entropy <= 0 {
		t.Errorf("entropy should be positive, got %v", g.Entropy)
	}

	// 符号开启时必须至少含一个符号
	found := false
	for i := 0; i < 50; i++ {
		g, err := app.GenerateRandom(12, false, true)
		if err != nil {
			t.Fatalf("GenerateRandom: %v", err)
		}
		if strings.ContainsAny(g.Password, "!@.-_*") {
			found = true
			break
		}
	}
	if !found {
		t.Error("symbols required but none produced in 50 trials")
	}
}

func TestGenerateMemorable(t *testing.T) {
	app := NewApp()
	g, err := app.GenerateMemorable(3, true, true)
	if err != nil {
		t.Fatalf("GenerateMemorable: %v", err)
	}
	if !strings.Contains(g.Password, "-") {
		t.Errorf("want '-' separated words, got %q", g.Password)
	}
	if g.Entropy <= 0 {
		t.Errorf("entropy should be positive, got %v", g.Entropy)
	}
}

func TestGeneratePIN(t *testing.T) {
	app := NewApp()
	g, err := app.GeneratePIN(7)
	if err != nil {
		t.Fatalf("GeneratePIN: %v", err)
	}
	if len(g.Password) != 7 {
		t.Errorf("want length 7, got %d (%q)", len(g.Password), g.Password)
	}
	for _, c := range g.Password {
		if c < '0' || c > '9' {
			t.Errorf("PIN should be digits only, got %q", g.Password)
			break
		}
	}
	want := float32(7 * 3.3219280948873623)
	if g.Entropy < want-0.1 || g.Entropy > want+0.1 {
		t.Errorf("PIN(7) entropy want ~%.2f, got %.2f", want, g.Entropy)
	}
}
